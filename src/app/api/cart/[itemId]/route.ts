import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { refreshCart, serializeCart } from "@/lib/cart";
import { z } from "zod";

const patchSchema = z.object({
  qty: z.coerce.number().int().min(0),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function badRequest(message: string) {
  return jsonError(message, 400);
}

function validationError(message: string) {
  return jsonError(message, 422);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { itemId: itemIdParam } = await params;
  const itemId = Number(itemIdParam);
  if (!Number.isFinite(itemId) || itemId <= 0) {
    return badRequest("Invalid item id");
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? "Invalid request";
    return validationError(message);
  }

  const qty = parsed.data.qty;
  const userId = Number(session.user.id);

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: { select: { id: true, userId: true, status: true } },
        product: { select: { stock: true } },
      },
    });

    if (!item || item.order.userId !== userId) {
      return { kind: "not_found" as const };
    }

    if (item.order.status !== OrderStatus.cart) {
      return {
        kind: "invalid_state" as const,
        message: "Cannot modify a finalized order",
      };
    }

    if (qty === 0) {
      await tx.orderItem.delete({ where: { id: itemId } });
      const updatedCart = await refreshCart(item.order.id, tx);
      return { kind: "success" as const, cart: updatedCart };
    }

    const available = item.product.stock;
    if (available <= 0) {
      const updatedCart = await refreshCart(item.order.id, tx);
      return {
        kind: "conflict" as const,
        cart: updatedCart,
        qtyAccepted: 0,
        reason: "out_of_stock",
      };
    }

    const cappedQty = Math.min(qty, available);
    await tx.orderItem.update({
      where: { id: itemId },
      data: {
        qty: cappedQty,
        capturedAt: new Date(),
      },
    });

    const updatedCart = await refreshCart(item.order.id, tx);
    if (cappedQty < qty) {
      return {
        kind: "conflict" as const,
        cart: updatedCart,
        qtyAccepted: cappedQty,
        reason: "insufficient_stock",
      };
    }

    return { kind: "success" as const, cart: updatedCart };
  });

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  if (result.kind === "invalid_state") {
    return NextResponse.json({ error: result.message }, { status: 409 });
  }

  if (result.kind === "conflict") {
    return NextResponse.json(
      {
        cart: serializeCart(result.cart),
        qtyAccepted: result.qtyAccepted,
        reason: result.reason,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ cart: serializeCart(result.cart) });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { itemId: itemIdParam } = await params;
  const itemId = Number(itemIdParam);
  if (!Number.isFinite(itemId) || itemId <= 0) {
    return badRequest("Invalid item id");
  }

  const userId = Number(session.user.id);

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: { select: { id: true, userId: true, status: true } },
      },
    });

    if (!item || item.order.userId !== userId) {
      return { kind: "not_found" as const };
    }

    if (item.order.status !== OrderStatus.cart) {
      return {
        kind: "invalid_state" as const,
        message: "Cannot modify a finalized order",
      };
    }

    await tx.orderItem.delete({ where: { id: itemId } });
    const updatedCart = await refreshCart(item.order.id, tx);
    return { kind: "success" as const, cart: updatedCart };
  });

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  if (result.kind === "invalid_state") {
    return NextResponse.json({ error: result.message }, { status: 409 });
  }

  return NextResponse.json({ cart: serializeCart(result.cart) });
}
