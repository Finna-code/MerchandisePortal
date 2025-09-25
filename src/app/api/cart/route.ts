import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getOrCreateActiveCart,
  refreshCart,
  serializeCart,
  toMinorUnits,
} from "@/lib/cart";
import { z } from "zod";

const postSchema = z.object({
  productId: z.coerce.number().int().positive(),
  variantId: z.string().trim().min(1).optional(),
  qty: z.coerce.number().int().positive().default(1),
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const cart = await getOrCreateActiveCart(Number(session.user.id));
  return NextResponse.json(serializeCart(cart));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? "Invalid request";
    return validationError(message);
  }

  const userId = Number(session.user.id);
  const { productId, variantId, qty } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, active: true },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        stock: true,
      },
    });

    if (!product) {
      return { kind: "not_found" as const };
    }

    const cart = await getOrCreateActiveCart(userId, tx);
    const matchingVariant = variantId ?? null;
    const existing = cart.items.find(
      (item) =>
        item.productId === product.id &&
        (item.variantId ?? null) === matchingVariant,
    );

    if (cart.items.length > 0 && cart.order.currency !== product.currency) {
      return {
        kind: "conflict" as const,
        cart,
        qtyAccepted: existing?.qty ?? 0,
        reason: "currency_mismatch",
      };
    }

    if (cart.items.length === 0 && cart.order.currency !== product.currency) {
      await tx.order.update({
        where: { id: cart.order.id },
        data: { currency: product.currency },
      });
      cart.order.currency = product.currency;
    }

    const desiredQty = (existing?.qty ?? 0) + qty;
    const available = product.stock;

    if (available <= 0) {
      const updatedCart = await refreshCart(cart.order.id, tx);
      return {
        kind: "conflict" as const,
        cart: updatedCart,
        qtyAccepted: existing?.qty ?? 0,
        reason: "out_of_stock",
      };
    }

    const cappedQty = Math.min(desiredQty, available);
    const unitPrice = toMinorUnits(product.price);

    if (!existing && cappedQty === 0) {
      const updatedCart = await refreshCart(cart.order.id, tx);
      return {
        kind: "conflict" as const,
        cart: updatedCart,
        qtyAccepted: 0,
        reason: "out_of_stock",
      };
    }

    const payload = {
      qty: cappedQty,
      unitPrice,
      currency: product.currency,
      variantId: matchingVariant,
      capturedAt: new Date(),
    };

    if (existing) {
      await tx.orderItem.update({
        where: { id: existing.id },
        data: payload,
      });
    } else if (cappedQty > 0) {
      await tx.orderItem.create({
        data: {
          orderId: cart.order.id,
          productId: product.id,
          ...payload,
        },
      });
    }

    const updatedCart = await refreshCart(cart.order.id, tx);
    if (cappedQty < desiredQty) {
      return {
        kind: "conflict" as const,
        cart: updatedCart,
        qtyAccepted: cappedQty,
        reason: "insufficient_stock",
      };
    }

    return {
      kind: "success" as const,
      cart: updatedCart,
      qtyAccepted: cappedQty,
    };
  });

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
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

  return NextResponse.json({
    cart: serializeCart(result.cart),
    qtyAccepted: result.qtyAccepted,
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const userId = Number(session.user.id);
  const cart = await prisma.$transaction(async (tx) => {
    const current = await getOrCreateActiveCart(userId, tx);
    await tx.orderItem.deleteMany({ where: { orderId: current.order.id } });
    const refreshed = await refreshCart(current.order.id, tx);
    return serializeCart(refreshed);
  });

  return new NextResponse(null, {
    status: 204,
    headers: {
      "X-Cart-State": JSON.stringify(cart),
    },
  });
}

