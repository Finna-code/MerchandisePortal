import crypto from "node:crypto";

import { OrderStatus } from "@prisma/client";

import { prisma } from "./db";
import {
  OrderNotFoundError,
  OrderStateError,
  StockConflictError,
  assertSufficientStock,
  generateInvoiceNo,
  getOrderForUser,
  getOrderWithRelations,
  incrementOrderVersion,
  recordOrderEvent,
  serializeOrder,
} from "./orders";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

function randomRazorpayOrderId() {
  return `order_${crypto.randomBytes(8).toString("hex")}`;
}

function needsExternalRazorpay() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

type RazorpayOrderResponse = {
  orderId: number;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string | null;
  status: "created" | "paid";
  testMode: boolean;
};

export async function createRazorpayOrderIntent(orderId: number, userId: number): Promise<RazorpayOrderResponse> {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForUser(orderId, userId, tx);

    if (order.status === OrderStatus.paid) {
      return {
        orderId: order.id,
        razorpayOrderId: order.payment?.razorpayOrderId ?? randomRazorpayOrderId(),
        amount: order.total,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID ?? null,
        status: "paid",
        testMode: !needsExternalRazorpay(),
      };
    }

    if (order.status !== OrderStatus.pending) {
      throw new OrderStateError("Order must be pending before initiating payment");
    }

    if (!order.fulfillmentType) {
      throw new OrderStateError("Select delivery or pickup details before payment");
    }

    if (
      order.fulfillmentType === "delivery" &&
      (!order.shippingLine1 || !order.shippingCity || !order.shippingState || !order.shippingPincode || !order.shippingPhone)
    ) {
      throw new OrderStateError("Delivery address is incomplete");
    }

    if (
      order.fulfillmentType === "pickup" &&
      (!order.pickupPoint || !order.pickupSlotStart || !order.pickupSlotEnd)
    ) {
      throw new OrderStateError("Pickup details are incomplete");
    }

    await assertSufficientStock(
      order.items.map((item) => ({ productId: item.productId, qty: item.qty })),
      tx,
    );

    let razorpayOrderId = order.payment?.razorpayOrderId ?? randomRazorpayOrderId();
    const testMode = !needsExternalRazorpay();

    if (needsExternalRazorpay()) {
      const keyId = process.env.RAZORPAY_KEY_ID!;
      const keySecret = process.env.RAZORPAY_KEY_SECRET!;
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: order.total,
          currency: order.currency,
          receipt: `order_${order.id}`,
          payment_capture: 1,
        }),
      });

      if (!res.ok) {
        throw new OrderStateError(`Failed to create Razorpay order (${res.status})`);
      }

      const json = (await res.json()) as { id: string };
      razorpayOrderId = json.id;
    }

    if (order.payment) {
      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          amount: order.total,
          currency: order.currency,
          razorpayOrderId,
          status: "created",
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          razorpayOrderId,
          status: "created",
        },
      });
    }

    await recordOrderEvent(order.id, "payment_intent_created", { byUserId: userId, meta: { razorpayOrderId } }, tx);

    return {
      orderId: order.id,
      razorpayOrderId,
      amount: order.total,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID ?? null,
      status: "created",
      testMode,
    };
  });
}

type FinalizeParams = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature?: string | null;
  rawBody: string;
  skipSignatureCheck?: boolean;
  source?: "webhook" | "manual";
};

export async function finalizeRazorpayPayment(params: FinalizeParams) {
  const { razorpayOrderId, razorpayPaymentId, signature, rawBody, skipSignatureCheck, source = "webhook" } = params;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret && !skipSignatureCheck) {
    if (!signature) {
      throw new OrderStateError("Missing Razorpay signature");
    }
    const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (computed !== signature) {
      throw new OrderStateError("Invalid Razorpay signature");
    }
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { razorpayOrderId },
    });

    if (!payment) {
      throw new OrderNotFoundError("Payment record missing for webhook");
    }

    const order = await getOrderWithRelations(payment.orderId, tx);

    if (payment.status === "paid") {
      return serializeOrder(order);
    }

    if (order.status !== OrderStatus.pending) {
      throw new OrderStateError("Order is not pending payment");
    }

    const conflicts: StockConflictError["conflicts"] = [];
    for (const item of order.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });

      if (updated.count === 0) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        conflicts.push({ productId: item.productId, requested: item.qty, available: product?.stock ?? 0 });
      }
    }

    if (conflicts.length > 0) {
      throw new StockConflictError(conflicts);
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        razorpayPayId: razorpayPaymentId,
      },
    });

    const invoiceNo = order.invoiceNo ?? generateInvoiceNo(order.id);

    await incrementOrderVersion(tx, order.id, order.version, {
      status: OrderStatus.paid,
      paidAt: new Date(),
      invoiceNo,
    });

    await recordOrderEvent(order.id, "payment_succeeded", { meta: { razorpayPaymentId, source } }, tx);
    await recordOrderEvent(order.id, "order_paid", { meta: { invoiceNo } }, tx);

    const fresh = await getOrderWithRelations(order.id, tx);
    return serializeOrder(fresh);
  });
}




