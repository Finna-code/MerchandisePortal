"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[] | null>(null);
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
                <Skeleton className="w-[200px] h-[200px] mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-10 w-28 mt-auto" />
              </div>
            ))
          : products.length === 0
          ? <div className="col-span-full text-center text-gray-500">No products available.</div>
          : products.map((product) => {
              let imageSrc = "/logo.svg";
              if (Array.isArray(product.images) && typeof product.images[0] === "string") {
                imageSrc = product.images[0];
              }
              return (
                <div key={product.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="object-contain rounded mb-4"
                  />
                  <h2 className="text-xl font-semibold mb-2 text-center">{product.name}</h2>
                  <p className="text-gray-600 text-sm mb-2 text-center line-clamp-2">{product.description}</p>
                  <div className="font-bold text-lg mb-2">₹{product.price?.toString?.() ?? product.price}</div>
                  <Link href={`/products/${product.id}`} className="mt-auto inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">View Details</Link>
                </div>
              );
            })}
      </div>
    </main>
  );
}
