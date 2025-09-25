"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { SerializedCart } from "@/types/cart";
import {
  deriveEmptyCart,
  parseCartHeader,
  parseCartPayload,
} from "@/lib/cart-client";

type CartStateValue = {
  cart: SerializedCart | null;
  setCartSnapshot: (snapshot: SerializedCart | null) => void;
  applyCartResponse: (
    payload: unknown,
    headers: Headers,
    status: number,
  ) => SerializedCart | null;
};

const CartStateContext = createContext<CartStateValue | null>(null);

export function CartStateProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<SerializedCart | null>(null);

  const setCartSnapshot = useCallback((snapshot: SerializedCart | null) => {
    setCart(snapshot);
  }, []);

  const applyCartResponse = useCallback(
    (payload: unknown, headers: Headers, status: number) => {
      const fromHeader = parseCartHeader(headers);
      if (fromHeader) {
        setCart(fromHeader);
        return fromHeader;
      }

      const fromPayload = parseCartPayload(payload);
      if (fromPayload) {
        setCart(fromPayload);
        return fromPayload;
      }

      if (status === 204) {
        let snapshot: SerializedCart | null = null;
        setCart((prev) => {
          snapshot = deriveEmptyCart(prev);
          return snapshot;
        });
        return snapshot;
      }

      return null;
    },
    [],
  );

  const value = useMemo(
    () => ({ cart, setCartSnapshot, applyCartResponse }),
    [cart, setCartSnapshot, applyCartResponse],
  );

  return <CartStateContext.Provider value={value}>{children}</CartStateContext.Provider>;
}

export function useCartState() {
  const context = useContext(CartStateContext);
  if (!context) {
    throw new Error("useCartState must be used within CartStateProvider");
  }
  return context;
}


