export const CATEGORIES = [
  "APPAREL",
  "ACCESSORIES",
  "STATIONERY",
  "ELECTRONICS",
  "LIFESTYLE",
  "GIFTING",
] as const;

export type Category = typeof CATEGORIES[number];

export function isCategory(x: unknown): x is Category {
  return typeof x === "string" && (CATEGORIES as readonly string[]).includes(x);
}

