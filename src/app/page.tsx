import { prisma } from "@/lib/db";

export default async function Home() {
  const products = await prisma.product.findMany({ take: 5 });
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Product Catalog</h1>
      <ul>
        {products.map(p => (
          <li key={p.id} className="border p-3 mb-2 rounded">
            {p.name} — ₹{p.price.toString()}
          </li>
        ))}
      </ul>
    </main>
  );
}
