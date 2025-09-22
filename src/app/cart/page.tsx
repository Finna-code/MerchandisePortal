export default function CartPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <div className="rounded-md border p-6 bg-white dark:bg-gray-900/30">
        <p className="text-gray-600 dark:text-gray-300">
          Your cart is empty for now. Browse products and add items to your cart.
        </p>
      </div>
    </main>
  );
}
