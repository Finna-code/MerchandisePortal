import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createPendingOrder } from "@/lib/checkout-service";
import { OrderStateError, StockConflictError, summarizeStockConflicts } from "@/lib/orders";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createPendingOrder(Number(session.user.id));
    return NextResponse.json({
      orderId: result.order.id,
      orderStatus: result.order.status,
      orderTotal: result.order.total,
      currency: result.order.currency,
      cart: result.cart,
      order: result.order,
    });
  } catch (error) {
    if (error instanceof StockConflictError) {
      return NextResponse.json(
        { error: "Insufficient stock", detail: summarizeStockConflicts(error.conflicts) },
        { status: 409 },
      );
    }

    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("cart/checkout", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}


