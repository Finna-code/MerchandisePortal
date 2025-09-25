"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/money";
import type { SerializedOrder } from "@/lib/orders";

type AdminAction = "mark_ready" | "mark_delivered" | "cancel";

function formatDate(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleString();
}

function printWindow(title: string, body: string) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body { font-family: sans-serif; padding: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    h1 { margin-top: 0; }
  </style></head><body>${body}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

function formatEvent(type: string) {
  switch (type) {
    case "checkout_started":
      return "Checkout started";
    case "fulfillment_delivery_set":
      return "Delivery details captured";
    case "fulfillment_pickup_set":
      return "Pickup details captured";
    case "payment_intent_created":
      return "Payment intent created";
    case "payment_succeeded":
      return "Payment succeeded";
    case "order_paid":
      return "Marked as paid";
    case "order_ready":
      return "Marked ready";
    case "order_delivered":
      return "Delivered";
    case "order_canceled":
      return "Canceled by customer";
    case "order_canceled_admin":
      return "Canceled by admin";
    default:
      return type;
  }
}

export default function AdminOrderDetail({ initialOrder }: { initialOrder: SerializedOrder }) {
  const { toast } = useToast();
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState<AdminAction | null>(null);

  const pickList = useMemo(() => {
    const grouped = new Map<number, { name: string; qty: number }>();
    for (const item of order.items) {
      const existing = grouped.get(item.productId);
      if (existing) {
        existing.qty += item.qty;
      } else {
        grouped.set(item.productId, { name: item.productName, qty: item.qty });
      }
    }
    return Array.from(grouped.entries()).map(([productId, value]) => ({ productId, ...value }));
  }, [order.items]);

  const canMarkReady = order.status === "paid";
  const canMarkDelivered = order.status === "ready";
  const canCancel = order.status === "pending";

  async function runAction(action: AdminAction) {
    setUpdating(action);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = await res.json();
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Action failed",
          description: payload?.error ?? "Unable to update order",
        });
        return;
      }

      setOrder(payload as SerializedOrder);
      toast({ variant: "invert", title: "Order updated" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setUpdating(null);
    }
  }

  function handlePrintPickList() {
    const rows = pickList
      .map((item) => `<tr><td>${item.name}</td><td>${item.qty}</td></tr>`)
      .join("");
    printWindow(
      `Pick list #${order.id}`,
      `<h1>Pick list for order #${order.id}</h1><table><thead><tr><th>Product</th><th>Qty</th></tr></thead><tbody>${rows}</tbody></table>`,
    );
  }

  function handlePrintInvoice() {
    const rows = order.items
      .map(
        (item) =>
          `<tr><td>${item.productName}</td><td>${item.qty}</td><td>${formatMoney(item.unitPrice, item.currency)}</td><td>${formatMoney(item.lineTotal, item.currency)}</td></tr>`,
      )
      .join("");
    const summary = `<tr><td colspan="3" style="text-align:right;">Subtotal</td><td>${formatMoney(order.subtotal, order.currency)}</td></tr>` +
      `<tr><td colspan="3" style="text-align:right;">Tax</td><td>${formatMoney(order.tax, order.currency)}</td></tr>` +
      `<tr><td colspan="3" style="text-align:right;font-weight:bold;">Total</td><td>${formatMoney(order.total, order.currency)}</td></tr>`;
    const address = order.shipping
      ? `<p><strong>Ship to:</strong><br/>${order.shipping.line1 ?? ""}<br/>${order.shipping.line2 ?? ""}<br/>${order.shipping.city ?? ""} ${order.shipping.pincode ?? ""}<br/>${order.shipping.state ?? ""}</p>`
      : order.pickup
        ? `<p><strong>Pickup:</strong> ${order.pickup.point ?? ""}, ${formatDate(order.pickup.slotStart)} - ${formatDate(order.pickup.slotEnd)}</p>`
        : "";
    printWindow(
      `Invoice #${order.invoiceNo ?? order.id}`,
      `<h1>Invoice for order #${order.id}</h1>${address}<table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${rows}${summary}</tbody></table>`,
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <p className="text-sm text-muted-foreground">Status: {order.status.toUpperCase()}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handlePrintPickList}>Print pick list</Button>
          <Button variant="outline" onClick={handlePrintInvoice}>Print invoice</Button>
          <Button variant="outline" disabled title="Assign staff coming soon">
            Assign staff
          </Button>
          <Button
            onClick={() => runAction("mark_ready")}
            disabled={!canMarkReady || updating === "mark_ready"}
          >
            {updating === "mark_ready" ? "Marking..." : "Mark ready"}
          </Button>
          <Button
            onClick={() => runAction("mark_delivered")}
            disabled={!canMarkDelivered || updating === "mark_delivered"}
          >
            {updating === "mark_delivered" ? "Marking..." : "Mark delivered"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => runAction("cancel")}
            disabled={!canCancel || updating === "cancel"}
          >
            {updating === "cancel" ? "Canceling..." : "Cancel order"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {order.user?.name ?? "Unknown"}</p>
            <p><span className="text-muted-foreground">Email:</span> {order.user?.email}</p>
            {order.fulfillmentType === "delivery" && order.shipping && (
              <div>
                <p className="text-muted-foreground">Shipping to:</p>
                <p>{order.shipping.line1}</p>
                {order.shipping.line2 && <p>{order.shipping.line2}</p>}
                <p>
                  {order.shipping.city} {order.shipping.pincode}
                </p>
                <p>{order.shipping.state}</p>
                {order.shipping.phone && <p>Phone: {order.shipping.phone}</p>}
              </div>
            )}
            {order.fulfillmentType === "pickup" && order.pickup && (
              <div>
                <p className="text-muted-foreground">Pickup at:</p>
                <p>{order.pickup.point}</p>
                <p>
                  {formatDate(order.pickup.slotStart)} - {formatDate(order.pickup.slotEnd)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Status:</span> {order.payment?.status ?? "pending"}</p>
            <p><span className="text-muted-foreground">Total:</span> {formatMoney(order.total, order.currency)}</p>
            {order.invoiceNo && <p><span className="text-muted-foreground">Invoice:</span> {order.invoiceNo}</p>}
            {order.timestamps.paidAt && (
              <p><span className="text-muted-foreground">Paid at:</span> {formatDate(order.timestamps.paidAt)}</p>
            )}
            {order.payment?.razorpayOrderId && (
              <p><span className="text-muted-foreground">Razorpay order:</span> {order.payment.razorpayOrderId}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/products/${item.productSlug}`} className="hover:underline">
                      {item.productName}
                    </Link>
                  </TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{formatMoney(item.unitPrice, item.currency)}</TableCell>
                  <TableCell>{formatMoney(item.lineTotal, item.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Pick list</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {pickList.map((item) => (
                <li key={item.productId} className="rounded border p-3 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">Qty {item.qty}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {order.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {order.events.map((event) => (
                <li key={event.id} className="border-l-2 border-muted pl-4">
                  <p className="text-sm font-medium">{formatEvent(event.type)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(event.at)}</p>
                  {event.actor && (
                    <p className="text-xs text-muted-foreground">By {event.actor.name ?? event.actor.email}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

