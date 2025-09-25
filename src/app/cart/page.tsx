import Link from "next/link";
import { auth } from "@/auth";
import { getOrCreateActiveCart, serializeCart } from "@/lib/cart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CartView from "./cart-view";

export default async function CartPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to see your cart</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Create an account or sign in to keep track of the items you love and pick up where you left off.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const cartSummary = await getOrCreateActiveCart(Number(session.user.id));
  const initialCart = serializeCart(cartSummary);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <CartView initialCart={initialCart} />
    </main>
  );
}

