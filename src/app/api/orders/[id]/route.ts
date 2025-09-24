import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { OrderNotFoundError, OrderOwnershipError, getOrderForUser, serializeOrder } from "@/lib/orders";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const order = await getOrderForUser(orderId, Number(session.user.id));
    return NextResponse.json(serializeOrder(order));
  } catch (error) {
    if (error instanceof OrderOwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("orders/[id]", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
