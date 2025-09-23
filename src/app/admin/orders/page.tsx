"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Select, SelectItem } from "@/components/ui/select";

const ORDER_STATUSES = ["draft","placed","paid","ready","delivered","canceled"] as const;

type Order = {
  id: number;
  status: (typeof ORDER_STATUSES)[number];
  type: "individual" | "group";
  subtotal: number;
  tax: number;
  total: number;
  pickupPoint?: string | null;
  createdAt: string;
  user: { id: number; name: string | null; email: string };
  dept?: { id: number; name: string } | null;
  items: { id: number; qty: number; price: number; product: { id: number; name: string } }[];
};

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/signin");
  }, [status, session, router]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOrders(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load orders";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      load();
    }
  }, [status, session]);

  async function updateStatus(orderId: number, newStatus: Order["status"]) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to update");
      await load();
      toast({ variant: "success", title: "Order updated", description: `Status set to ${newStatus}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update order status";
      setError(msg);
      toast({ variant: "destructive", title: "Update failed", description: String(msg) });
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
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
                    <TableCell>{o.user?.name ?? o.user?.email}</TableCell>
                    <TableCell className="capitalize">{o.type}</TableCell>
                    <TableCell>
                      ₹{typeof o.total === "number" ? o.total.toFixed(2) : String(o.total)}
                    </TableCell>
                    <TableCell className="capitalize">{o.status}</TableCell>
                    <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={o.status}
                        onValueChange={(val) => updateStatus(o.id, val as Order["status"])}
                        aria-label={`Status for order #${o.id}`}
                        className="min-w-36"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </Select>
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
