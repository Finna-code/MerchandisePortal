"use client";

import { useCallback, useState } from "react";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  describeCartConflict,
  parseCartConflict,
  parseCartError,
} from "@/lib/cart-client";
import { cn } from "@/lib/utils";
import { useCartState } from "./cart-state-provider";

type ButtonProps = ComponentProps<typeof Button>;

type AddToCartButtonProps = {
  productId: number;
  variantId?: string | null;
  qty?: number;
} & Omit<ButtonProps, "onClick" | "type">;

export function AddToCartButton({
  productId,
  variantId,
  qty = 1,
  className,
  children,
  disabled,
  ...buttonProps
}: AddToCartButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { applyCartResponse } = useCartState();
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(async () => {
    if (pending) return;
    setPending(true);
    try {
      const payload: {
        productId: number;
        qty: number;
        variantId?: string;
      } = { productId, qty };
      if (variantId) {
        payload.variantId = variantId;
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        toast({
          variant: "invert",
          title: "Sign in required",
          description: "Sign in to add items to your cart.",
        });
        router.push("/signin");
        return;
      }

      let json: unknown = null;
      if (res.status !== 204) {
        try {
          json = await res.json();
        } catch {
          json = null;
        }
      }

      if (res.ok) {
        applyCartResponse(json, res.headers, res.status);
        toast({
          variant: "success",
          title: "Added to cart",
          description: "Item saved to your cart.",
        });
        router.refresh();
        return;
      }

      if (res.status === 409) {
        const conflict = parseCartConflict(json);
        applyCartResponse(json, res.headers, res.status);
        toast({
          variant: "invert",
          title: "Couldn't add item",
          description: describeCartConflict(conflict),
        });
        return;
      }

      if (res.status === 422) {
        const message = parseCartError(json) ?? "Please check the product details and try again.";
        toast({
          variant: "destructive",
          title: "Unable to add",
          description: message,
        });
        return;
      }

      const fallback = parseCartError(json) ?? "Unable to add item to your cart.";
      toast({
        variant: "destructive",
        title: "Unable to add",
        description: fallback,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Something went wrong while adding the item.",
      });
    } finally {
      setPending(false);
    }
  }, [applyCartResponse, pending, productId, qty, variantId, router, toast]);

  return (
    <Button
      type="button"
      {...buttonProps}
      className={cn(
        "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm",
        className,
      )}
      disabled={disabled || pending}
      onClick={handleClick}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Adding...
        </span>
      ) : (
        children ?? "Add to Cart"
      )}
    </Button>
  );
}

