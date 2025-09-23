export type SerializedCartItemProduct = {
  id: number;
  name: string;
  image: string | null;
};

export type SerializedCartItem = {
  itemId: number;
  product: SerializedCartItemProduct;
  qty: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
  variantId: string | null;
  stock: number | null;
};

export type SerializedCart = {
  orderId: number;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  items: SerializedCartItem[];
};

