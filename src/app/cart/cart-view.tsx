"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import {
  describeCartConflict,
  deriveEmptyCart,
  parseCartConflict,
  parseCartError,
  type CartConflictPayload,
} from "@/lib/cart-client";
import { formatMoney, getMoneyFormatter } from "@/lib/money";
import { useCartState } from "@/components/cart/cart-state-provider";
import type { SerializedCart, SerializedCartItem } from "@/types/cart";

type CartViewProps = {
  initialCart: SerializedCart;
};

type ConflictPayload = CartConflictPayload;

const fallbackImage = (
  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
);

export default function CartView({ initialCart }: CartViewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { cart: sharedCart, setCartSnapshot, applyCartResponse } = useCartState();
  const [cart, setCart] = useState<SerializedCart>(initialCart);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    setCart(initialCart);
    setCartSnapshot(initialCart);
  }, [initialCart, setCartSnapshot]);

  useEffect(() => {
    if (!sharedCart) return;
    setCart(sharedCart);
  }, [sharedCart]);

  const formatCartMoney = useMemo(
    () => getMoneyFormatter(cart.currency || "INR"),
    [cart.currency],
  );

  const processResponse = useCallback(
    async (
      res: Response,
      options?: {
        successDescription?: string;
        conflictDescription?: (payload: ConflictPayload) => string;
        successToast?: boolean;
      },
    ) => {
      let payload: unknown = null;
      if (res.status !== 204) {
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }
      }

      if (res.ok) {
        const snapshot = applyCartResponse(payload, res.headers, res.status);
        if (snapshot) {
          setCart(snapshot);
        } else if (res.status === 204) {
          setCart((prev) => deriveEmptyCart(prev) ?? prev);
        }
        if (options?.successToast && options.successDescription) {
          toast({
            variant: "success",
            title: "Cart updated",
            description: options.successDescription,
          });
        }
        return true;
      }

      if (res.status === 409) {
        const conflict = parseCartConflict(payload);
        const snapshot = applyCartResponse(payload, res.headers, res.status);
        if (snapshot) {
          setCart(snapshot);
        }
        const description = options?.conflictDescription
          ? options.conflictDescription(conflict)
          : describeCartConflict(conflict);
        toast({
          variant: "invert",
          title: "Heads up",
          description,
        });
        return false;
      }

      const message = parseCartError(payload) ?? "Unable to update your cart.";
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: message,
      });
      return false;
    },
    [toast, applyCartResponse],
  );

  const updateQuantity = useCallback(
    async (item: SerializedCartItem, nextQty: number) => {
      if (nextQty < 0 || nextQty === item.qty) return;
      setUpdatingItemId(item.itemId);
      try {
        const res = await fetch(`/api/cart/${item.itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qty: nextQty }),
          cache: "no-store",
          credentials: "include",
        });
        await processResponse(res, {
          conflictDescription: describeCartConflict,
        });
      } finally {
        setUpdatingItemId(null);
      }
    },
    [processResponse],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      setRemovingItemId(itemId);
      try {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: "DELETE",
          cache: "no-store",
          credentials: "include",
        });
        await processResponse(res, {
          successToast: true,
          successDescription: "Removed the item from your cart.",
        });
      } finally {
        setRemovingItemId(null);
      }
    },
    [processResponse],
  );

  const clearCart = useCallback(async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        cache: "no-store",
        credentials: "include",
      });
      await processResponse(res, {
        successToast: true,
        successDescription: "Emptied your cart.",
      });
    } finally {
      setClearing(false);
    }
  }, [processResponse]);

  const busy = checkingOut || clearing || updatingItemId !== null || removingItemId !== null;
  const handleCheckout = useCallback(async () => {
    if (busy || cart.items.length === 0) {
      if (cart.items.length === 0) {
        toast({
          variant: "invert",
          title: "Cart is empty",
          description: "Add items before checking out.",
        });
      }
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout/start", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });

      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : "We couldn't start checkout.";
        toast({
          variant: "destructive",
          title: "Checkout failed",
          description: message,
        });
        return;
      }

      const data = (payload ?? {}) as Record<string, unknown>;
      const cartPayload = data.cart as SerializedCart | undefined;
      if (cartPayload) {
        setCart(cartPayload);
        setCartSnapshot(cartPayload);
      }
      const orderPayload = data.order as Record<string, unknown> | undefined;
      const orderId = orderPayload && typeof orderPayload.id === "number" ? orderPayload.id : undefined;
      const total = orderPayload && typeof orderPayload.total === "number" ? orderPayload.total : undefined;
      const currency = orderPayload && typeof orderPayload.currency === "string" ? orderPayload.currency : undefined;
      const summary = total !== undefined && currency ? `Total: ${formatMoney(total, currency)}` : "Review your order details to proceed.";

      if (orderId) {
        toast({
          variant: "success",
          title: `Order #${orderId} pending`,
          description: summary,
        });
        router.push(`/checkout/${orderId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Checkout error",
          description: "Order response was incomplete. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unexpected error during checkout.",
      });
    } finally {
      setCheckingOut(false);
    }
  }, [busy, cart.items.length, router, setCart, setCartSnapshot, toast]);

  const itemCountLabel = useMemo(() => {
    const count = cart.itemCount ?? cart.items.length;
    const suffix = count === 1 ? "item" : "items";
    return `${count} ${suffix}`;
  }, [cart.itemCount, cart.items.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <p className="text-sm text-muted-foreground">{itemCountLabel}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="min-h-[240px]">
          <CardHeader className="pb-4">
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div>
                  <p className="text-lg font-semibold">Your cart is empty.</p>
                  <p className="text-sm text-muted-foreground">Browse products and add items to get started.</p>
                </div>
                <Button asChild className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
                  <Link href="/products">Browse Products</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {cart.items.map((item) => {
                  const isUpdating = updatingItemId === item.itemId;
                  const isRemoving = removingItemId === item.itemId;
                  const disableDecrease = isUpdating || item.qty <= 1;
                  const maxQty = typeof item.stock === "number" ? item.stock : Infinity;
                  const disableIncrease = isUpdating || item.qty >= maxQty;

                  return (
                    <li key={item.itemId} className="py-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                          <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
                            {item.product.image ? (
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : (
                              fallbackImage
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-medium" title={item.product.name}>
                              {item.product.name}
                            </p>
                            {item.variantId && (
                              <p className="mt-1 text-sm text-muted-foreground" title={item.variantId}>
                                Variant: {item.variantId}
                              </p>
                            )}
                            <p className="mt-2 text-sm text-muted-foreground">
                              Unit price: {formatMoney(item.unitPrice, item.currency)}
                            </p>
                            {typeof item.stock === "number" && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-stretch gap-4 sm:items-end sm:text-right">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label="Decrease quantity"
                              onClick={() => updateQuantity(item, item.qty - 1)}
                              disabled={disableDecrease}
                            >
                              <Minus className="size-4" />
                            </Button>
                            <span className="w-10 text-center font-medium">{item.qty}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label="Increase quantity"
                              onClick={() => updateQuantity(item, item.qty + 1)}
                              disabled={disableIncrease}
                            >
                              <Plus className="size-4" />
                            </Button>
                            {isUpdating && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <span className="text-base font-semibold">
                              {formatCartMoney(item.lineTotal)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.itemId)}
                              disabled={isRemoving || busy}
                              aria-label="Remove item"
                              className="text-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              {isRemoving ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">{formatCartMoney(cart.subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="font-medium">{formatCartMoney(cart.tax)}</dd>
                </div>
                <div className="flex items-center justify-between pt-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatCartMoney(cart.total)}</dd>
                </div>
              </dl>
              {/* TEMP: enable checkout button for testing; remove once checkout is implemented. */}
              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={cart.items.length === 0 || busy}
              >
                {checkingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Processing...
                  </span>
                ) : (
                  "Proceed to checkout"
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                We&apos;re putting the finishing touches on checkout.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={
                      cart.items.length === 0 ||
                      clearing ||
                      updatingItemId !== null ||
                      removingItemId !== null
                    }
                  >
                    {clearing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Empty cart"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Empty cart?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete everything off your cart?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearCart} disabled={busy}>
                      Empty cart
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button asChild variant="ghost">
                <Link href="/products">Keep shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}










