import { Prisma, OrderStatus } from "@prisma/client";

import { prisma } from "./db";

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

const CART_ITEM_PRODUCT_SELECT = {
  id: true,
  name: true,
  images: true,
  price: true,
  currency: true,
  stock: true,
} as const;

const CART_ITEM_INCLUDE = {
  product: {
    select: CART_ITEM_PRODUCT_SELECT,
  },
} as const;

const CART_INCLUDE = {
  items: {
    include: CART_ITEM_INCLUDE,
    orderBy: {
      id: "asc" as const,
    },
  },
} as const;

type CartRecord = Prisma.OrderGetPayload<{ include: typeof CART_INCLUDE }>;
export type CartItemWithProduct = Prisma.OrderItemGetPayload<{ include: typeof CART_ITEM_INCLUDE }>;
export type CartSummary = {
  order: Omit<CartRecord, "items">;
  items: CartItemWithProduct[];
};

export function toMinorUnits(value: Prisma.Decimal | number | string): number {
  const decimal =
    value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  return decimal.mul(100).round().toNumber();
}

function computeCartTotals(items: CartItemWithProduct[]) {
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  const tax = 0;
  const total = subtotal + tax;
  const itemCount = items.reduce((count, item) => count + item.qty, 0);
  return { subtotal, tax, total, itemCount };
}

function extractPrimaryImage(images: unknown): string | null {
  if (Array.isArray(images)) {
    const first = images.find((entry) => typeof entry === "string" && entry.length > 0);
    return typeof first === "string" ? first : null;
  }
  return null;
}

export function serializeCart(summary: CartSummary) {
  const { subtotal, tax, total, itemCount } = computeCartTotals(summary.items);
  return {
    orderId: summary.order.id,
    currency: summary.order.currency,
    subtotal,
    tax,
    total,
    itemCount,
    items: summary.items.map((item) => ({
      itemId: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        image: extractPrimaryImage(item.product.images) ?? null,
      },
      qty: item.qty,
      unitPrice: item.unitPrice,
      currency: item.currency,
      lineTotal: item.qty * item.unitPrice,
      variantId: item.variantId ?? null,
      stock: item.product.stock,
    })),
  };
}

async function persistTotals(orderId: number, items: CartItemWithProduct[], db: PrismaClientOrTx) {
  const { subtotal, tax, total } = computeCartTotals(items);
  await db.order.update({
    where: { id: orderId },
    data: { subtotal, tax, total },
  });
  return { subtotal, tax, total };
}

export async function getOrCreateActiveCart(
  userId: number,
  db: PrismaClientOrTx = prisma,
): Promise<CartSummary> {
  const cart = await db.order.findFirst({
    where: { userId, status: OrderStatus.cart },
    include: CART_INCLUDE,
    orderBy: { id: "desc" },
  });

  if (cart) {
    if (cart.cartUserId !== userId) {
      cart.cartUserId = userId;
      await db.order.update({
        where: { id: cart.id },
        data: { cartUserId: userId },
      });
    }
    const totals = computeCartTotals(cart.items);
    if (
      cart.subtotal !== totals.subtotal ||
      cart.tax !== totals.tax ||
      cart.total !== totals.total
    ) {
      const { subtotal, tax, total } = totals;
      await db.order.update({
        where: { id: cart.id },
        data: { subtotal, tax, total },
      });
      cart.subtotal = subtotal;
      cart.tax = tax;
      cart.total = total;
    }
    const { items, ...orderWithoutItems } = cart;
    return { order: orderWithoutItems, items };
  }

  const created = await db.order.create({
    data: {
      userId,
      status: OrderStatus.cart,
      subtotal: 0,
      tax: 0,
      total: 0,
      currency: "INR",
      cartUserId: userId,
    },
    include: CART_INCLUDE,
  });
  const { items, ...orderWithoutItems } = created;
  return { order: orderWithoutItems, items };
}

export async function refreshCart(
  orderId: number,
  db: PrismaClientOrTx = prisma,
): Promise<CartSummary> {
  const cart = await db.order.findUnique({
    where: { id: orderId },
    include: CART_INCLUDE,
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const totals = await persistTotals(cart.id, cart.items, db);
  cart.subtotal = totals.subtotal;
  cart.tax = totals.tax;
  cart.total = totals.total;

  const { items, ...orderWithoutItems } = cart;
  return { order: orderWithoutItems, items };
}


