import { Prisma, type OrderItem } from "@prisma/client";

import { prisma } from "./db";
import { formatMoney } from "./money";

const ORDER_ITEM_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
    },
  },
} as const;

const ORDER_WITH_ITEMS_INCLUDE = {
  items: {
    include: ORDER_ITEM_INCLUDE,
    orderBy: { id: "asc" as const },
  },
  payment: true,
  events: {
    orderBy: { at: "asc" as const },
    include: {
      byUser: {
        select: { id: true, name: true, email: true },
      },
    },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
} as const;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_WITH_ITEMS_INCLUDE }>;

export class OrderNotFoundError extends Error {
  constructor(message = "Order not found") {
    super(message);
    this.name = "OrderNotFoundError";
  }
}

export class OrderOwnershipError extends Error {
  constructor(message = "You do not have access to this order") {
    super(message);
    this.name = "OrderOwnershipError";
  }
}

export class OrderStateError extends Error {
  constructor(message = "Order is not in a valid state for this action") {
    super(message);
    this.name = "OrderStateError";
  }
}

export class StockConflictError extends Error {
  conflicts: Array<{ productId: number; requested: number; available: number }>;

  constructor(conflicts: Array<{ productId: number; requested: number; available: number }>) {
    super("Insufficient stock for one or more items");
    this.name = "StockConflictError";
    this.conflicts = conflicts;
  }
}

export async function getOrderWithRelations(orderId: number, db: Prisma.TransactionClient | typeof prisma = prisma) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: ORDER_WITH_ITEMS_INCLUDE,
  });

  if (!order) throw new OrderNotFoundError();
  return order;
}

export async function getOrderForUser(orderId: number, userId: number, db: Prisma.TransactionClient | typeof prisma = prisma) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: ORDER_WITH_ITEMS_INCLUDE,
  });

  if (!order) throw new OrderNotFoundError();
  if (order.userId !== userId) throw new OrderOwnershipError();
  return order;
}

export function serializeOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    status: order.status,
    fulfillmentType: order.fulfillmentType,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    currency: order.currency,
    shipping: order.fulfillmentType === "delivery"
      ? {
          line1: order.shippingLine1 ?? null,
          line2: order.shippingLine2 ?? null,
          city: order.shippingCity ?? null,
          state: order.shippingState ?? null,
          pincode: order.shippingPincode ?? null,
          phone: order.shippingPhone ?? null,
        }
      : null,
    pickup: order.fulfillmentType === "pickup"
      ? {
          point: order.pickupPoint ?? null,
          slotStart: order.pickupSlotStart?.toISOString() ?? null,
          slotEnd: order.pickupSlotEnd?.toISOString() ?? null,
        }
      : null,
    timestamps: {
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
      readyAt: order.readyAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
    },
    invoiceNo: order.invoiceNo,
    version: order.version,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSlug: item.product.slug,
      image: Array.isArray(item.product.images)
        ? (item.product.images.find((entry) => typeof entry === "string" && entry.length > 0) as string | undefined) ?? null
        : null,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.qty * item.unitPrice,
      currency: item.currency,
      variantId: item.variantId,
    })),
    payment: order.payment
      ? {
          status: order.payment.status,
          razorpayOrderId: order.payment.razorpayOrderId,
          razorpayPayId: order.payment.razorpayPayId,
          amount: order.payment.amount,
          currency: order.payment.currency,
          createdAt: order.payment.createdAt.toISOString(),
          updatedAt: order.payment.updatedAt.toISOString(),
        }
      : null,
    user: order.user,
    events: order.events.map((event) => ({
      id: event.id,
      type: event.type,
      at: event.at.toISOString(),
      meta: event.meta,
      actor: event.byUser ? { id: event.byUser.id, name: event.byUser.name, email: event.byUser.email } : null,
    })),
  };
}

export function computeTotals(items: Pick<OrderItem, "qty" | "unitPrice">[]) {
  const subtotal = items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const tax = 0;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function describeMoney(amount: number, currency: string) {
  return formatMoney(amount, currency);
}

export function summarizeStockConflicts(conflicts: StockConflictError["conflicts"]) {
  return conflicts.map((entry) => `Product ${entry.productId}: requested ${entry.requested}, available ${entry.available}`).join("; ");
}

export async function assertSufficientStock(
  items: { productId: number; qty: number }[],
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  if (items.length === 0) return;

  const productIds = items.map((item) => item.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, stock: true },
  });

  const conflicts: StockConflictError["conflicts"] = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || product.stock < item.qty) {
      conflicts.push({ productId: item.productId, requested: item.qty, available: product?.stock ?? 0 });
    }
  }

  if (conflicts.length > 0) {
    throw new StockConflictError(conflicts);
  }
}

export async function recordOrderEvent(
  orderId: number,
  type: string,
  params: { meta?: Prisma.JsonValue | null; byUserId?: number } = {},
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await db.orderEvent.create({
    data: {
      orderId,
      type,
      meta: params.meta === null ? Prisma.JsonNull : params.meta,
      byUserId: params.byUserId,
    },
  });
}

export async function incrementOrderVersion(
  db: Prisma.TransactionClient,
  orderId: number,
  expectedVersion: number,
  data: Prisma.OrderUpdateInput,
) {
  const updated = await db.order.updateMany({
    where: { id: orderId, version: expectedVersion },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    throw new OrderStateError("Order update conflict, please retry");
  }
}

export function generateInvoiceNo(orderId: number) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${yyyy}${mm}${dd}-${orderId}-${rand}`;
}


export type SerializedOrder = ReturnType<typeof serializeOrder>;


