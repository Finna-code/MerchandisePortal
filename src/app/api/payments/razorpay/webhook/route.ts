import { NextRequest, NextResponse } from "next/server";

import { finalizeRazorpayPayment } from "@/lib/payment-service";
import { OrderNotFoundError, OrderStateError, StockConflictError, summarizeStockConflicts } from "@/lib/orders";

function resolveOrderId(payload: unknown): string | null {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (typeof data.razorpay_order_id === "string") return data.razorpay_order_id;

    const nested = data.payload as Record<string, unknown> | undefined;
    const payment = nested?.payment as Record<string, unknown> | undefined;
    const entity = payment?.entity as Record<string, unknown> | undefined;
    if (entity && typeof entity.order_id === "string") return entity.order_id;
  }
  return null;
}

function resolvePaymentId(payload: unknown): string | null {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (typeof data.razorpay_payment_id === "string") return data.razorpay_payment_id;

    const nested = data.payload as Record<string, unknown> | undefined;
    const payment = nested?.payment as Record<string, unknown> | undefined;
    const entity = payment?.entity as Record<string, unknown> | undefined;
    if (entity && typeof entity.id === "string") return entity.id;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!rawBody) {
    return NextResponse.json({ error: "Empty payload" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const razorpayOrderId = resolveOrderId(payload);
  const razorpayPaymentId = resolvePaymentId(payload);

  if (!razorpayOrderId || !razorpayPaymentId) {
    return NextResponse.json({ error: "Missing Razorpay identifiers" }, { status: 422 });
  }

  const headerSignature = req.headers.get("x-razorpay-signature");
  const bodySignature =
    typeof payload === "object" && payload &&
    typeof (payload as Record<string, unknown>).razorpay_signature === "string"
      ? ((payload as Record<string, unknown>).razorpay_signature as string)
      : null;
  const signature = headerSignature ?? bodySignature;
  const skipSignatureCheck = !process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    const order = await finalizeRazorpayPayment({
      razorpayOrderId,
      razorpayPaymentId,
      signature,
      rawBody,
      skipSignatureCheck,
      source: skipSignatureCheck ? "manual" : "webhook",
    });
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof StockConflictError) {
      return NextResponse.json(
        { error: "Insufficient stock", detail: summarizeStockConflicts(error.conflicts) },
        { status: 409 },
      );
    }

    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("payments/razorpay/webhook", error);
    return NextResponse.json({ error: "Failed to finalize payment" }, { status: 500 });
  }
}




