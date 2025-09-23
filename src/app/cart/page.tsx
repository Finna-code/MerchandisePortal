import { auth } from "@/auth";

export default async function CartPage() {
  // Trigger route-level loading for consistent UX
  await auth();
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <div className="rounded-md border p-6 bg-card text-card-foreground">
        <p className="text-muted-foreground">
          Your cart is empty for now. Browse products and add items to your cart.
        </p>
      </div>
    </main>
  );
}
