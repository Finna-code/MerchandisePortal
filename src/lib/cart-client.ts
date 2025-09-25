import type { SerializedCart } from "@/types/cart";

export type CartConflictPayload = {
  reason?: string;
  qtyAccepted?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const CART_STATE_HEADER = "x-cart-state";

export function describeCartConflict({ reason, qtyAccepted }: CartConflictPayload): string {
  if (reason === "out_of_stock") {
    return "This item just went out of stock.";
  }
  if (reason === "insufficient_stock") {
    if (!qtyAccepted || qtyAccepted === 0) {
      return "No stock left for this item right now.";
    }
    return `We adjusted the quantity to ${qtyAccepted} based on current stock.`;
  }
  if (reason === "currency_mismatch") {
    return "Items in your cart must share the same currency.";
  }
  return "We refreshed your cart with the latest availability.";
}

export function parseCartConflict(value: unknown): CartConflictPayload {
  if (!isRecord(value)) return {};
  const reason = value.reason;
  const qtyAccepted = value.qtyAccepted;
  return {
    reason: typeof reason === "string" ? reason : undefined,
    qtyAccepted: typeof qtyAccepted === "number" ? qtyAccepted : undefined,
  };
}

export function parseCartError(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const error = value.error;
  return typeof error === "string" ? error : null;
}

export function parseCartPayload(value: unknown): SerializedCart | null {
  if (!isRecord(value)) return null;
  const cart = value.cart;
  if (!isRecord(cart)) return null;
  return cart as SerializedCart;
}

export function parseCartHeader(headers: Headers): SerializedCart | null {
  const raw = headers.get(CART_STATE_HEADER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SerializedCart;
  } catch {
    return null;
  }
}

export function deriveEmptyCart(previous: SerializedCart | null): SerializedCart | null {
  if (!previous) return null;
  return {
    ...previous,
    items: [],
    itemCount: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
  };
}

