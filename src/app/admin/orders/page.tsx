"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/money";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending payment",
  paid: "Paid",
  ready: "Ready",
  delivered: "Delivered",
  canceled: "Canceled",
};

type Order = {
  id: number;
  status: keyof typeof STATUS_LABEL | string;
  fulfillmentType?: "delivery" | "pickup" | null;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  pickupPoint?: string | null;
  shippingLine1?: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
  user: { id: number; name: string | null; email: string };
  dept?: { id: number; name: string } | null;
};

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/signin");
  }, [status, session, router]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Order[];
      setOrders(data);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load orders";
      setError(msg);
      toast({ variant: "destructive", title: "Unable to load orders", description: msg });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      load();
    }
  }, [status, session, load]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/admin" className="font-medium text-foreground hover:underline">
          Admin Panel
        </Link>
        <span className="mx-1">/</span>
        <span>Orders</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold">Manage Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</div>
          )}
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No orders yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>#{o.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{o.user?.name ?? "Unknown user"}</span>
                        <span className="text-xs text-muted-foreground">{o.user?.email}</span>
                        <span className="text-xs text-muted-foreground">User ID: {o.user?.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{o.fulfillmentType ?? "--"}</TableCell>
                    <TableCell>{formatMoney(o.total, o.currency)}</TableCell>
                    <TableCell className="capitalize">{STATUS_LABEL[o.status] ?? o.status}</TableCell>
                    <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="rounded border px-3 py-1 text-sm font-medium text-foreground transition hover:bg-muted"
                      >
                        View details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}



