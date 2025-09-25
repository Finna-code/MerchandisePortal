import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return notFound();

  const session = await auth();

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      currency: true,
      images: true,
      category: true,
      stock: true,
      active: true,
      ratingCount: true,
      ratingSum: true,
    },
  });

  if (!product || !product.active) return notFound();

  const firstImage = Array.isArray(product.images) ? product.images[0] : undefined;
  const imageSrc = typeof firstImage === "string" && firstImage.length > 0 ? firstImage : "/logo.svg";

  const priceNumber = typeof product.price === "number" ? product.price : Number(product.price);
  const currency = product.currency ?? "INR";
  const formattedPrice = Number.isFinite(priceNumber)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(priceNumber)
    : product.price?.toString?.() ?? String(product.price);

  const ratingSummary = {
    ratingCount: product.ratingCount ?? 0,
    ratingSum: product.ratingSum ?? 0,
  };

  const viewerId = session?.user?.id ?? null;
  const viewerIsAdmin = session?.user?.role === "admin";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-lg border bg-card p-4 text-card-foreground">
          <Image src={imageSrc} alt={product.name} width={500} height={500} className="rounded object-contain" />
        </div>
        <div>
          <h1 className="mb-3 text-3xl font-bold">{product.name}</h1>
          <div className="mb-4 text-muted-foreground">{product.description}</div>
          <div className="mb-6 text-2xl font-semibold">{formattedPrice}</div>
          <div className="flex gap-3">
            <AddToCartButton productId={product.id} />
            <Button
              asChild
              variant="outline"
              className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm"
            >
              <Link href="/products">Back to Products</Link>
            </Button>
          </div>
          <div className="mt-6 text-sm text-muted-foreground">
            Category: {product.category} · In stock: {product.stock}
          </div>
        </div>
      </div>

      <ProductReviews
        productId={product.id}
        initialSummary={ratingSummary}
        viewerId={viewerId}
        viewerIsAdmin={viewerIsAdmin}
      />
    </main>
  );
}


