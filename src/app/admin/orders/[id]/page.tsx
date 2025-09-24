import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrderNotFoundError, getOrderWithRelations, serializeOrder } from "@/lib/orders";

import AdminOrderDetail from "./admin-order-detail";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/signin");
  }

  const orderId = Number(params.id);
  if (!Number.isFinite(orderId)) {
    notFound();
  }

  try {
    const orderRecord = await getOrderWithRelations(orderId);
    const order = serializeOrder(orderRecord);
    return <AdminOrderDetail initialOrder={order} />;
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      notFound();
    }
    throw error;
  }
}
