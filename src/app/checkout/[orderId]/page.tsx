import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrderNotFoundError, OrderOwnershipError, getOrderForUser, serializeOrder } from "@/lib/orders";

import CheckoutFlow from "./checkout-flow";

type CheckoutOrderPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutOrderPage({ params }: CheckoutOrderPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const resolvedParams = await params;
  const orderId = Number(resolvedParams.orderId);
  if (!Number.isFinite(orderId)) {
    notFound();
  }

  try {
    const orderRecord = await getOrderForUser(orderId, Number(session.user.id));
    const order = serializeOrder(orderRecord);
    return <CheckoutFlow initialOrder={order} />;
  } catch (error) {
    if (error instanceof OrderOwnershipError) {
      redirect("/cart");
    }
    if (error instanceof OrderNotFoundError) {
      notFound();
    }
    throw error;
  }
}

