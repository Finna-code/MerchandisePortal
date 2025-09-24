import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateActiveCart, refreshCart, serializeCart } from "@/lib/cart";
import { OrderStatus } from "@prisma/client";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const userId = Number(session.user.id);

  const result = await prisma.$transaction(async (tx) => {
    const cartRecord = await tx.order.findFirst({
      where: { userId, status: OrderStatus.cart },
      include: { items: true },
      orderBy: { id: "desc" },
    });

    if (!cartRecord) {
      const cart = await getOrCreateActiveCart(userId, tx);
      return { kind: "no_cart" as const, cart };
    }

    const confirmedCart = await refreshCart(cartRecord.id, tx);

    if (confirmedCart.items.length === 0) {
      return { kind: "empty" as const, cart: confirmedCart };
    }

    // TEMP: mark checkout orders as pending until real payment flow is implemented.
    await tx.order.update({
      where: { id: cartRecord.id },
      data: {
        status: OrderStatus.pending,
        cartUserId: null,
      },
    });

    const freshCart = await getOrCreateActiveCart(userId, tx);

    return {
      kind: "success" as const,
      orderId: cartRecord.id,
      orderStatus: OrderStatus.pending,
      orderTotal: confirmedCart.order.total,
      currency: confirmedCart.order.currency,
      cart: freshCart,
    };
  });

  if (result.kind === "success") {
    return NextResponse.json({
      orderId: result.orderId,
      orderStatus: result.orderStatus,
      orderTotal: result.orderTotal,
      currency: result.currency,
      cart: serializeCart(result.cart),
    });
  }

  const cartPayload = serializeCart(result.cart);
  const message = result.kind === "empty" ? "Your cart is empty." : "Active cart not found.";

  return NextResponse.json({ error: message, cart: cartPayload }, { status: 409 });
}