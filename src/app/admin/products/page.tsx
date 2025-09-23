"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  stock: number;
  active: boolean;
  createdAt?: string;
};

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/signin");
  }, [status, session, router]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    currency: "INR",
    image: "",
    category: "",
    stock: "0",
  });
  const [priceFocused, setPriceFocused] = useState(false);
  const [stockFocused, setStockFocused] = useState(false);
  const disableCreate = useMemo(() => {
    return !form.name || !form.slug || !form.description || !form.price || !form.category;
  }, [form]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProducts(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load products";
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

  async function createProduct() {
    try {
      setError(null);
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: Number(form.price),
        currency: form.currency || "INR",
        images: form.image ? [form.image] : [],
        category: form.category,
        stock: Number(form.stock || 0),
        active: true,
      };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to create");
      setForm({ name: "", slug: "", description: "", price: "", currency: "INR", image: "", category: "", stock: "0" });
      await load();
      toast({ variant: "invert", title: "Product created" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create product";
      setError(msg);
      toast({ variant: "destructive", title: "Create failed", description: String(msg) });
    }
  }

  async function toggleActive(p: Product) {
    try {
      setError(null);
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: p.active ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: p.active ? undefined : JSON.stringify({ active: true }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to update");
      await load();
      toast({ variant: "invert", title: p.active ? "Product deactivated" : "Product activated" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update product";
      setError(msg);
      toast({ variant: "destructive", title: "Update failed", description: String(msg) });
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            <Input placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <div className="relative">
              <Input
                type="number"
                step={1}
                min={0}
                inputMode="numeric"
                value={priceFocused ? (form.price === "0" ? "" : form.price) : (!form.price || form.price === "0" ? "" : form.price)}
                onFocus={() => setPriceFocused(true)}
                onBlur={() => setPriceFocused(false)}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="bg-background dark:bg-input/30 pr-16"
              />
              {!priceFocused && (!form.price || form.price === "0") && (
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground/70">
                  Price
                </span>
              )}
              <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Decrease price"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm"
                  onClick={() => setForm((f) => ({ ...f, price: String(Math.max(0, (Number(f.price || 0) || 0) - 1)) }))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Increase price"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm"
                  onClick={() => setForm((f) => ({ ...f, price: String(Math.max(0, (Number(f.price || 0) || 0) + 1)) }))}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <Input placeholder="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            <Input placeholder="Image URL" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
            <div className="relative">
              <Input
                type="number"
                step={1}
                min={0}
                inputMode="numeric"
                value={stockFocused ? (form.stock === "0" ? "" : form.stock) : (!form.stock || form.stock === "0" ? "" : form.stock)}
                onFocus={() => setStockFocused(true)}
                onBlur={() => setStockFocused(false)}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className="bg-background dark:bg-input/30 pr-16"
              />
              {!stockFocused && (!form.stock || form.stock === "0") && (
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground/70">
                  Stock
                </span>
              )}
              <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Decrease stock"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm"
                  onClick={() => setForm((f) => ({ ...f, stock: String(Math.max(0, (Number(f.stock || 0) || 0) - 1)) }))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Increase stock"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm"
                  onClick={() => setForm((f) => ({ ...f, stock: String(Math.max(0, (Number(f.stock || 0) || 0) + 1)) }))}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center"><Button onClick={createProduct} disabled={disableCreate}>Create</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.slug}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>
                      {p.currency} {typeof p.price === "number" ? p.price.toFixed(2) : String(p.price)}
                    </TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>{p.active ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(p)}>
                        {p.active ? "Deactivate" : "Activate"}
                      </Button>
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
