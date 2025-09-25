import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { cancelPendingOrder } from "@/lib/order-actions";
import { OrderNotFoundError, OrderOwnershipError, OrderStateError } from "@/lib/orders";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  try {
    const order = await cancelPendingOrder(orderId, Number(session.user.id));
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderOwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("orders/[id]/cancel", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}

