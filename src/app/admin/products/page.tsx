"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/constants/categories";
import { Trash, Pencil, Save, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import ImageUpload from "@/components/admin/ImageUpload";
import Image from "next/image";
import DeleteImage from "@/components/admin/DeleteImage";

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

function ProductRow({ p, onChanged }: { p: Product; onChanged: () => Promise<void> | void }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name: p.name ?? "",
    slug: p.slug ?? "",
    description: p.description ?? "",
    price: String(p.price ?? 0),
    currency: p.currency ?? "INR",
    image: (p.images?.[0] as string | undefined) ?? "",
    category: p.category ?? "",
    stock: String(p.stock ?? 0),
    active: p.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${p.id}` , {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          price: Number(form.price || 0),
          currency: form.currency || "INR",
          images: form.image ? [form.image] : [],
          category: form.category,
          stock: Number(form.stock || 0),
          active: Boolean(form.active),
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to update");
      setEdit(false);
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete ${p.name}? This action cannot be undone.` )) return;
    const res = await fetch(`/api/admin/products/${p.id}` , { method: "DELETE" });
    if (!res.ok) {
      setError((await res.json())?.error || "Delete failed");
      return;
    }
    await onChanged();
  }

  return (
    <TableRow>
      {/* Name */}
      <TableCell className="font-medium">
        {edit ? (
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        ) : (
          p.name
        )}
      </TableCell>
      {/* Slug */}
      <TableCell>
        {edit ? (
          <div className="space-y-2">
            <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            {/* Inline image editor */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Image URL"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              />
              <ImageUpload onUploaded={(url) => setForm((f) => ({ ...f, image: url }))} />
            </div>
            {form.image && (
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded">
                  <Image src={form.image} alt="" fill className="object-cover" sizes="40px" />
                </div>
                <DeleteImage
                  imageUrl={form.image}
                  editMode={true}
                  onDeleted={() => setForm((f) => ({ ...f, image: "" }))}
                />
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{p.slug}</span>
        )}
      </TableCell>
      {/* Description */}
      <TableCell>
        {edit ? (
          <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        ) : (
          <span className="text-sm text-muted-foreground">{p.description}</span>
        )}
      </TableCell>
      {/* Category */}
      <TableCell>
        {edit ? (
          <Select value={form.category} onValueChange={(val: string) => setForm((f) => ({ ...f, category: val }))} placeholder="Category" className="min-w-32">
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
            ))}
          </Select>
        ) : (
          p.category
        )}
      </TableCell>
      {/* Price */}
      <TableCell>
        {edit ? (
          <Input type="number" step={1} min={0} inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
        ) : (
          `${p.currency} ${typeof p.price === "number" ? p.price.toFixed(2) : String(p.price)}`
        )}
      </TableCell>
      {/* Stock */}
      <TableCell>
        {edit ? (
          <Input type="number" step={1} min={0} inputMode="numeric" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
        ) : (
          p.stock
        )}
      </TableCell>
      {/* Status */}
      <TableCell>
        {edit ? (
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
        ) : (
          p.active ? "Active" : "Inactive"
        )}
      </TableCell>
      {/* Actions */}
      <TableCell className="text-right">
        {edit ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={saving}
              onClick={save}
              className="gap-1.5 group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm"
            >
              <Save className="h-4 w-4 transition-transform duration-150 group-hover:rotate-3 group-hover:scale-110" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => setEdit(false)}
              className="gap-1.5 group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm"
            >
              <X className="h-4 w-4 transition-transform duration-150 group-hover:-rotate-3 group-hover:scale-110" />
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEdit(true)}
              className="gap-1.5 group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm"
            >
              <Pencil className="h-4 w-4 transition-transform duration-150 group-hover:-rotate-3 group-hover:scale-110" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={remove}
              aria-label={`Delete ${p.name}`}
              title={`Delete ${p.name}`}
              className="gap-1.5 group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm"
            >
              <Trash className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12 group-hover:scale-110" />
            </Button>
          </div>
        )}
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      </TableCell>
    </TableRow>
  );
}

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
    return !form.name || !form.slug || !form.description || !form.price || !form.category || !form.image;
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
            <Select
  value={form.category}
  onValueChange={(val: string) => setForm((f) => ({ ...f, category: val }))}
  placeholder="Category"
  className="min-w-32"
>
  {CATEGORIES.map((c) => (
    <SelectItem key={c} value={c}>
      {c.charAt(0) + c.slice(1).toLowerCase()}
    </SelectItem>
  ))}
</Select>
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <div
              className="flex h-10 w-full items-center justify-between rounded-md border border-input
               bg-background text-foreground focus-within:ring-2 focus-within:ring-ring"
            >
              <button
                type="button"
                aria-label="Decrement price"
                onClick={() => setForm((f) => ({ ...f, price: String(Math.max(0, (Number(f.price || 0) || 0) - 1)) }))}
                disabled={Number(form.price) <= 0}
                className="h-full px-3 flex items-center justify-center hover:bg-accent
                 hover:text-accent-foreground disabled:opacity-40"
              >
                −
              </button>

              <div className="relative flex-1 h-full">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={priceFocused ? (form.price === "0" ? "" : form.price) : (!form.price || form.price === "0" ? "" : form.price)}
                  onFocus={() => setPriceFocused(true)}
                  onBlur={() => setPriceFocused(false)}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") { e.preventDefault(); setForm((f) => ({ ...f, price: String(Math.max(0, (Number(f.price || 0) || 0) + 1)) })); }
                    if (e.key === "ArrowDown") { e.preventDefault(); setForm((f) => ({ ...f, price: String(Math.max(0, (Number(f.price || 0) || 0) - 1)) })); }
                  }}
                  className="w-full h-full bg-transparent text-center outline-none
                 [appearance:textfield]
                 [::-webkit-outer-spin-button]:appearance-none
                 [::-webkit-inner-spin-button]:appearance-none"
                />
                {!priceFocused && (!form.price || form.price === "0") && (
                  <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground"
                    aria-hidden
                  >
                    Price
                  </span>
                )}
              </div>

              <button
                type="button"
                aria-label="Increment price"
                onClick={() => setForm((f) => ({ ...f, price: String(Math.max(0, (Number(f.price || 0) || 0) + 1)) }))}
                className="h-full px-3 flex items-center justify-center hover:bg-accent
                 hover:text-accent-foreground"
              >
                +
              </button>
            </div>
            <Input placeholder="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            <div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Image URL"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                />
                <ImageUpload onUploaded={(url) => setForm((f) => ({ ...f, image: url }))} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Images only, up to 5MB. We compress to WebP automatically.</p>
              {form.image ? (
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded">
                    <Image
                      src={form.image}
                      alt="preview"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <DeleteImage
                    imageUrl={form.image}
                    editMode={true}
                    onDeleted={() => setForm((f) => ({ ...f, image: "" }))}
                  />
                </div>
              ) : null}
            </div>
            <div
              className="flex h-10 w-full items-center justify-between rounded-md border border-input
               bg-background text-foreground focus-within:ring-2 focus-within:ring-ring"
            >
              <button
                type="button"
                aria-label="Decrement stock"
                onClick={() => setForm((f) => ({ ...f, stock: String(Math.max(0, (Number(f.stock || 0) || 0) - 1)) }))}
                disabled={Number(form.stock) <= 0}
                className="h-full px-3 flex items-center justify-center hover:bg-accent
                 hover:text-accent-foreground disabled:opacity-40"
              >
                −
              </button>

              <div className="relative flex-1 h-full">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={stockFocused ? (form.stock === "0" ? "" : form.stock) : (!form.stock || form.stock === "0" ? "" : form.stock)}
                  onFocus={() => setStockFocused(true)}
                  onBlur={() => setStockFocused(false)}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") { e.preventDefault(); setForm((f) => ({ ...f, stock: String(Math.max(0, (Number(f.stock || 0) || 0) + 1)) })); }
                    if (e.key === "ArrowDown") { e.preventDefault(); setForm((f) => ({ ...f, stock: String(Math.max(0, (Number(f.stock || 0) || 0) - 1)) })); }
                  }}
                  className="w-full h-full bg-transparent text-center outline-none
                 [appearance:textfield]
                 [::-webkit-outer-spin-button]:appearance-none
                 [::-webkit-inner-spin-button]:appearance-none"
                />
                {!stockFocused && (!form.stock || form.stock === "0") && (
                  <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground"
                    aria-hidden
                  >
                    Stock
                  </span>
                )}
              </div>

              <button
                type="button"
                aria-label="Increment stock"
                onClick={() => setForm((f) => ({ ...f, stock: String(Math.max(0, (Number(f.stock || 0) || 0) + 1)) }))}
                className="h-full px-3 flex items-center justify-center hover:bg-accent
                 hover:text-accent-foreground"
              >
                +
              </button>
            </div>
            <Button onClick={createProduct} disabled={disableCreate} className="h-10 w-full md:w-auto">Create</Button>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <ProductRow key={p.id} p={p} onChanged={load} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
