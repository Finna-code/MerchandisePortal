import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrderNotFoundError, getOrderWithRelations, serializeOrder } from "@/lib/orders";

import AdminOrderDetail from "./admin-order-detail";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/signin");
  }

  const resolvedParams = await params;
  const orderId = Number(resolvedParams.id);
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
