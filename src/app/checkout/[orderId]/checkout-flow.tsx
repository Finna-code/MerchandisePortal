"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/money";
import type { SerializedOrder } from "@/lib/orders";

const PICKUP_POINT_OPTIONS = [
  "Campus Stationery - Block A",
  "Campus Stationery - Auditorium Wing",
  "Campus Stationery - Near CCD",
] as const;

type DeliveryFormValues = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

type PickupFormValues = {
  point: string;
  slotStart: string;
  slotEnd: string;
};

type RazorpayIntent = {
  orderId: number;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string | null;
  status: "created" | "paid";
  testMode: boolean;
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function describeStatus(status: SerializedOrder["status"]) {
  switch (status) {
    case "pending":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "ready":
      return "Ready for handover";
    case "delivered":
      return "Delivered";
    case "canceled":
      return "Canceled";
    default:
      return status;
  }
}

export default function CheckoutFlow({ initialOrder }: { initialOrder: SerializedOrder }) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState(initialOrder);
  const [activeFulfillment, setActiveFulfillment] = useState<"delivery" | "pickup">(
    (initialOrder.fulfillmentType as "delivery" | "pickup" | null) ?? "delivery",
  );
  const [savingFulfillment, setSavingFulfillment] = useState<"delivery" | "pickup" | null>(null);
  const [placing, setPlacing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<RazorpayIntent | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const resolvedPickupPoint = useMemo(() => {
    const candidate = order.pickup?.point ?? "";
    if (candidate && PICKUP_POINT_OPTIONS.includes(candidate as typeof PICKUP_POINT_OPTIONS[number])) {
      return candidate;
    }
    return PICKUP_POINT_OPTIONS[0];
  }, [order.pickup?.point]);

  const availablePickupPoints = useMemo(() => {
    const set = new Set<string>(PICKUP_POINT_OPTIONS);
    if (order.pickup?.point) {
      set.add(order.pickup.point);
    }
    return Array.from(set);
  }, [order.pickup?.point]);

  const deliveryForm = useForm<DeliveryFormValues>({
    defaultValues: {
      line1: order.shipping?.line1 ?? "",
      line2: order.shipping?.line2 ?? "",
      city: order.shipping?.city ?? "",
      state: order.shipping?.state ?? "",
      pincode: order.shipping?.pincode ?? "",
      phone: order.shipping?.phone ?? "",
    },
  });

  const pickupForm = useForm<PickupFormValues>({
    defaultValues: {
      point: resolvedPickupPoint,
      slotStart: toDateTimeLocal(order.pickup?.slotStart ?? null),
      slotEnd: toDateTimeLocal(order.pickup?.slotEnd ?? null),
    },
  });

  useEffect(() => {
    deliveryForm.reset({
      line1: order.shipping?.line1 ?? "",
      line2: order.shipping?.line2 ?? "",
      city: order.shipping?.city ?? "",
      state: order.shipping?.state ?? "",
      pincode: order.shipping?.pincode ?? "",
      phone: order.shipping?.phone ?? "",
    });
  }, [order, deliveryForm]);

  useEffect(() => {
    pickupForm.reset({
      point: order.pickup?.point && availablePickupPoints.includes(order.pickup.point)
        ? order.pickup.point
        : availablePickupPoints[0],
      slotStart: toDateTimeLocal(order.pickup?.slotStart ?? null),
      slotEnd: toDateTimeLocal(order.pickup?.slotEnd ?? null),
    });
  }, [order, pickupForm]);

  const isLocked = order.status !== "pending";
  const canPlaceOrder = order.status === "pending" && Boolean(order.fulfillmentType);
  const totals = useMemo(
    () => ({
      subtotal: formatMoney(order.subtotal, order.currency),
      tax: formatMoney(order.tax, order.currency),
      total: formatMoney(order.total, order.currency),
    }),
    [order.subtotal, order.tax, order.total, order.currency],
  );

  async function refreshOrder() {
    try {
      const res = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
      if (res.ok) {
        const payload = (await res.json()) as SerializedOrder;
        setOrder(payload);
      }
    } catch (err) {
      console.error("refresh order", err);
    }
  }

  async function handleDeliverySubmit(values: DeliveryFormValues) {
    setSavingFulfillment("delivery");
    setPaymentMessage(null);
    try {
      const res = await fetch("/api/checkout/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          version: order.version,
          ...values,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Unable to save address", description: payload?.error ?? "Unexpected error" });
        return;
      }
      setOrder(payload as SerializedOrder);
      setActiveFulfillment("delivery");
      toast({ variant: "invert", title: "Delivery details saved" });
    } catch (error) {
      console.error("delivery submit", error);
      toast({ variant: "destructive", title: "Unable to save address", description: "Please try again." });
    } finally {
      setSavingFulfillment(null);
    }
  }

  async function handlePickupSubmit(values: PickupFormValues) {
    setSavingFulfillment("pickup");
    setPaymentMessage(null);
    try {
      const slotStartIso = fromDateTimeLocal(values.slotStart);
      const slotEndIso = fromDateTimeLocal(values.slotEnd);
      if (!slotStartIso || !slotEndIso) {
        toast({ variant: "destructive", title: "Invalid pickup window" });
        return;
      }

      const res = await fetch("/api/checkout/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          version: order.version,
          point: values.point,
          slotStart: slotStartIso,
          slotEnd: slotEndIso,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Unable to save pickup", description: payload?.error ?? "Unexpected error" });
        return;
      }
      setOrder(payload as SerializedOrder);
      setActiveFulfillment("pickup");
      toast({ variant: "invert", title: "Pickup details saved" });
    } catch (error) {
      console.error("pickup submit", error);
      toast({ variant: "destructive", title: "Unable to save pickup", description: "Please try again." });
    } finally {
      setSavingFulfillment(null);
    }
  }

  async function handlePlaceOrder() {
    if (!canPlaceOrder) return;
    setPlacing(true);
    setPaymentMessage(null);
    try {
      const res = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Unable to start payment", description: payload?.error ?? "Unexpected error" });
        return;
      }

      const intent = payload as RazorpayIntent;
      setPaymentIntent(intent);

      if (intent.status === "paid") {
        await refreshOrder();
        toast({ variant: "invert", title: "Order already paid" });
        return;
      }

      if (intent.testMode) {
        const mockedPaymentId = `pay_${Math.random().toString(36).slice(2, 10)}`;
        const webhookRes = await fetch("/api/payments/razorpay/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: intent.razorpayOrderId,
            razorpay_payment_id: mockedPaymentId,
          }),
        });
        const hookPayload = await webhookRes.json();
        if (!webhookRes.ok) {
          toast({ variant: "destructive", title: "Payment failed", description: hookPayload?.error ?? "Unexpected error" });
          return;
        }
        setOrder(hookPayload as SerializedOrder);
        toast({ variant: "invert", title: "Payment captured" });
        setPaymentMessage("Payment recorded via test webhook.");
      } else {
        setPaymentMessage(
          "Payment intent created. Launch Razorpay checkout with the returned order id to collect payment.",
        );
      }
    } catch (error) {
      console.error("place order", error);
      toast({ variant: "destructive", title: "Unable to start payment", description: "Please try again." });
    } finally {
      setPlacing(false);
      await refreshOrder();
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Order #{order.id}</p>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">{describeStatus(order.status)}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <Button
                type="button"
                variant={activeFulfillment === "delivery" ? "default" : "outline"}
                onClick={() => setActiveFulfillment("delivery")}
                disabled={isLocked}
              >
                Delivery
              </Button>
              <Button
                type="button"
                variant={activeFulfillment === "pickup" ? "default" : "outline"}
                onClick={() => setActiveFulfillment("pickup")}
                disabled={isLocked}
              >
                Pickup
              </Button>
            </div>

            {activeFulfillment === "delivery" ? (
              <Form {...deliveryForm}>
                <form className="space-y-4" onSubmit={deliveryForm.handleSubmit(handleDeliverySubmit)}>
                  <FormField
                    control={deliveryForm.control}
                    name="line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Street, area" {...field} disabled={isLocked || savingFulfillment === "delivery"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={deliveryForm.control}
                    name="line2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address line 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Apartment, landmarks" {...field} disabled={isLocked || savingFulfillment === "delivery"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={deliveryForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLocked || savingFulfillment === "delivery"} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={deliveryForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLocked || savingFulfillment === "delivery"} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={deliveryForm.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLocked || savingFulfillment === "delivery"} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={deliveryForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLocked || savingFulfillment === "delivery"} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={isLocked || savingFulfillment === "delivery"}>
                    {savingFulfillment === "delivery" ? "Saving..." : "Save delivery details"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...pickupForm}>
                <form className="space-y-4" onSubmit={pickupForm.handleSubmit(handlePickupSubmit)}>
                  <FormField
                    control={pickupForm.control}
                    name="point"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup point</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || availablePickupPoints[0]}
                            onValueChange={field.onChange}
                            disabled={isLocked || savingFulfillment === "pickup"}
                            className="w-full"
                            placeholder="Select a pickup point"
                          >
                            {availablePickupPoints.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={pickupForm.control}
                      name="slotStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slot start</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} disabled={isLocked || savingFulfillment === "pickup"} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pickupForm.control}
                      name="slotEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slot end</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} disabled={isLocked || savingFulfillment === "pickup"} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={isLocked || savingFulfillment === "pickup"}>
                    {savingFulfillment === "pickup" ? "Saving..." : "Save pickup details"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-4">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">Qty {item.qty}</p>
                    </div>
                    <div className="text-right text-sm font-semibold">
                      {formatMoney(item.lineTotal, item.currency)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{totals.subtotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{totals.tax}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{totals.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.status === "paid" || order.status === "ready" || order.status === "delivered" ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-green-700">Payment received.</p>
                  {order.invoiceNo && <p className="text-muted-foreground">Invoice #{order.invoiceNo}</p>}
                  {order.timestamps.paidAt && (
                    <p className="text-muted-foreground">Paid at {new Date(order.timestamps.paidAt).toLocaleString()}</p>
                  )}
                  <Button variant="outline" onClick={() => router.push("/products")}>Continue shopping</Button>
                </div>
              ) : order.status === "canceled" ? (
                <p className="text-sm text-muted-foreground">Order canceled. Start a new checkout from your cart.</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Complete payment to confirm your order. We&apos;ll hold your cart until payment succeeds.
                  </p>
                  <Button onClick={handlePlaceOrder} disabled={!canPlaceOrder || placing} className="w-full">
                    {placing ? "Processing..." : "Place order & pay"}
                  </Button>
                  {paymentMessage && <p className="text-sm text-muted-foreground">{paymentMessage}</p>}
                  {paymentIntent && paymentIntent.status === "created" && !paymentIntent.testMode && (
                    <div className="rounded border border-dashed p-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Gateway details</p>
                      <p>Order id: {paymentIntent.razorpayOrderId}</p>
                      {paymentIntent.keyId && <p>Key id: {paymentIntent.keyId}</p>}
                      <p>Amount: {formatMoney(paymentIntent.amount, paymentIntent.currency)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}













