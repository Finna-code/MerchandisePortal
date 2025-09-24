import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/guard";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { status: { in: [OrderStatus.pending, OrderStatus.paid, OrderStatus.canceled] } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      dept: true,
      items: { include: { product: { select: { id: true, name: true } } } },
      payment: true,
    },
  });
  return NextResponse.json(orders);
}
