// src/app/page.tsx
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const products = await prisma.product.findMany({
    where: { active: true },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return (
  <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section with background image and overlay */}
  <section className="w-full relative flex items-center justify-center py-20 md:py-32 overflow-hidden">
        {/* Abstract SVG background with gradient */}
        {/* Subtle background gradient only */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-indigo-100/60 to-white dark:from-gray-900 dark:to-gray-950" />
        <div className="relative z-10 text-center px-4 animate-fade-in-up max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-gray-900 dark:text-white drop-shadow-lg animate-fade-in-up">
            MerchPortal
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto mb-8 drop-shadow animate-fade-in-up delay-100">
            Your one-stop shop for exclusive merchandise. High-quality products, fast shipping, and great prices.
          </p>
          <Button asChild size="lg" className="shadow-lg animate-fade-in-up delay-200">
            <Link
              href={
                !session
                  ? "/products"
                  : (session as any)?.user?.role === "admin"
                  ? "/admin"
                  : "/dashboard"
              }
            >
              { !session ? "Shop Now" : (session as any)?.user?.role === "admin" ? "Admin Dashboard" : "Dashboard" }
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Products Section with shadcn/ui Card */}
      <section className="w-full py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured Products
          </h2>
          {products.length === 0 ? (
            <p className="text-center text-gray-500">
              No products found. Please check back later.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center">
              {products.map((product, idx) => {
                let imageSrc = "/logo.svg";
                if (Array.isArray(product.images) && typeof product.images[0] === "string") {
                  imageSrc = product.images[0];
                }
                return (
                  <Card
                    key={product.id}
                    className="flex flex-col h-full w-72 shadow-md hover:shadow-xl transition-shadow duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${100 + idx * 80}ms` }}
                  >
                    <CardHeader className="p-0">
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="w-full h-48 object-cover object-center rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                        draggable={false}
                      />
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 p-6">
                      <CardTitle className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          ₹{product.price?.toString?.() ?? product.price}
                        </span>
                        <Button asChild size="sm" className="ml-2">
                          <Link href={`/products/${product.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="text-center mt-12">
            <Button asChild variant="outline">
              <Link href="/products">
                View All Products
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
  <footer className="w-full bg-gray-900 text-white py-8 animate-fade-in-up delay-300">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 MerchPortal. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}