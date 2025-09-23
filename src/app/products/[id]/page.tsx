import { prisma } from "@/lib/db";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return notFound();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.active) return notFound();

  const firstImage = Array.isArray(product.images) ? product.images[0] : undefined;
  const imageSrc = typeof firstImage === "string" && firstImage.length > 0 ? firstImage : "/logo.svg";

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-card text-card-foreground border rounded-lg p-4 flex items-center justify-center">
          <Image src={imageSrc} alt={product.name} width={500} height={500} className="object-contain rounded" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
          <div className="text-muted-foreground mb-4">{product.description}</div>
          <div className="text-2xl font-semibold mb-6">₹{product.price?.toString?.() ?? String(product.price)}</div>
          <div className="flex gap-3">
            <Button asChild className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
              <Link href="/cart">Add to Cart</Link>
            </Button>
            <Button asChild variant="outline" className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
              <Link href="/products">Back to Products</Link>
            </Button>
          </div>
          <div className="mt-6 text-sm text-muted-foreground">
            Category: {product.category} · In stock: {product.stock}
          </div>
        </div>
      </div>
    </main>
  );
}
