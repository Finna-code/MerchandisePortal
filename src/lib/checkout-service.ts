import { FulfillmentType, OrderStatus } from "@prisma/client";

import { prisma } from "./db";
import { getOrCreateActiveCart, refreshCart, serializeCart } from "./cart";
import {
  OrderStateError,
  assertSufficientStock,
  getOrderForUser,
  recordOrderEvent,
  serializeOrder,
} from "./orders";
import { incrementOrderVersion } from "./orders";

export async function createPendingOrder(userId: number) {
  return prisma.$transaction(async (tx) => {
    const cartRecord = await tx.order.findFirst({
      where: { userId, status: OrderStatus.cart },
      select: { id: true },
      orderBy: { id: "desc" },
    });

    if (!cartRecord) {
      throw new OrderStateError("Active cart not found");
    }

    const cartSummary = await refreshCart(cartRecord.id, tx);

    if (cartSummary.items.length === 0) {
      throw new OrderStateError("Your cart is empty");
    }

    await assertSufficientStock(
      cartSummary.items.map((item) => ({ productId: item.productId, qty: item.qty })),
      tx,
    );

    const updated = await tx.order.updateMany({
      where: { id: cartSummary.order.id, status: OrderStatus.cart },
      data: {
        status: OrderStatus.pending,
        cartUserId: null,
        fulfillmentType: null,
        shippingLine1: null,
        shippingLine2: null,
        shippingCity: null,
        shippingState: null,
        shippingPincode: null,
        shippingPhone: null,
        pickupPoint: null,
        pickupSlotStart: null,
        pickupSlotEnd: null,
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      throw new OrderStateError("Cart already checked out");
    }

    await recordOrderEvent(
      cartSummary.order.id,
      "checkout_started",
      {
        byUserId: userId,
        meta: {
          subtotal: cartSummary.order.subtotal,
          total: cartSummary.order.total,
          currency: cartSummary.order.currency,
        },
      },
      tx,
    );

    const pendingOrder = await getOrderForUser(cartSummary.order.id, userId, tx);
    const freshCart = await getOrCreateActiveCart(userId, tx);

    return {
      order: serializeOrder(pendingOrder),
      cart: serializeCart(freshCart),
    };
  });
}

type DeliveryPayload = {
  orderId: number;
  version: number;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export async function updateDeliveryDetails(userId: number, payload: DeliveryPayload) {
  const { orderId, version, line1, line2, city, state, pincode, phone } = payload;
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForUser(orderId, userId, tx);

    if (order.version !== version) {
      throw new OrderStateError("Stale order version, please refresh and retry");
    }

    if (order.status !== OrderStatus.pending) {
      throw new OrderStateError("Only pending orders can be updated");
    }

    await incrementOrderVersion(tx, order.id, order.version, {
      fulfillmentType: FulfillmentType.delivery,
      shippingLine1: line1,
      shippingLine2: line2 ?? null,
      shippingCity: city,
      shippingState: state,
      shippingPincode: pincode,
      shippingPhone: phone,
      pickupPoint: null,
      pickupSlotStart: null,
      pickupSlotEnd: null,
    });

    await recordOrderEvent(
      order.id,
      "fulfillment_delivery_set",
      {
        byUserId: userId,
        meta: { city, state, pincode },
      },
      tx,
    );

    const fresh = await getOrderForUser(orderId, userId, tx);
    return serializeOrder(fresh);
  });
}

type PickupPayload = {
  orderId: number;
  version: number;
  point: string;
  slotStart: Date;
  slotEnd: Date;
};

export async function updatePickupDetails(userId: number, payload: PickupPayload) {
  const { orderId, version, point, slotStart, slotEnd } = payload;
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForUser(orderId, userId, tx);

    if (order.version !== version) {
      throw new OrderStateError("Stale order version, please refresh and retry");
    }

    if (order.status !== OrderStatus.pending) {
      throw new OrderStateError("Only pending orders can be updated");
    }

    await incrementOrderVersion(tx, order.id, order.version, {
      fulfillmentType: FulfillmentType.pickup,
      pickupPoint: point,
      pickupSlotStart: slotStart,
      pickupSlotEnd: slotEnd,
      shippingLine1: null,
      shippingLine2: null,
      shippingCity: null,
      shippingState: null,
      shippingPincode: null,
      shippingPhone: null,
    });

    await recordOrderEvent(
      order.id,
      "fulfillment_pickup_set",
      {
        byUserId: userId,
        meta: {
          point,
          slotStart: slotStart.toISOString(),
          slotEnd: slotEnd.toISOString(),
        },
      },
      tx,
    );

    const fresh = await getOrderForUser(orderId, userId, tx);
    return serializeOrder(fresh);
  });
}




