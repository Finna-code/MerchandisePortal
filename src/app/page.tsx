// src/app/page.tsx
import { prisma } from "@/lib/db"; // or "../lib/db" if no paths alias

export default async function Home() {
  const products = await prisma.product.findMany({ where: { active: true }, take: 12 });
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-4">Product Catalog</h1>
      {products.length === 0 ? (
        <p>No products found. Seed the database.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-sm text-gray-600">{p.description}</p>
              <p className="mt-2 font-medium">₹{Number(p.price).toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
