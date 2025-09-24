import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/guard";
import { markOrderDelivered, markOrderReady, cancelPendingOrderAsAdmin } from "@/lib/order-actions";
import { OrderNotFoundError, OrderStateError, getOrderWithRelations, serializeOrder } from "@/lib/orders";

const bodySchema = z.object({
  action: z.enum(["mark_ready", "mark_delivered", "cancel"]),
});

async function readParams(paramsPromise: Promise<{ id: string }>) {
  const { id } = await paramsPromise;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    throw new OrderStateError("Invalid order id");
  }
  return orderId;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const orderId = await readParams(params);
    const order = await getOrderWithRelations(orderId);
    return NextResponse.json(serializeOrder(order));
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("admin/orders/[id] GET", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    parsed = bodySchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues.at(0);
      return NextResponse.json({ error: issue?.message ?? "Invalid request" }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let orderId: number;
  try {
    orderId = await readParams(params);
  } catch (error) {
    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  try {
    switch (parsed.action) {
      case "mark_ready": {
        const order = await markOrderReady(orderId, Number(session.user.id));
        return NextResponse.json(order);
      }
      case "mark_delivered": {
        const order = await markOrderDelivered(orderId, Number(session.user.id));
        return NextResponse.json(order);
      }
      case "cancel": {
        const order = await cancelPendingOrderAsAdmin(orderId, Number(session.user.id));
        return NextResponse.json(order);
      }
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("admin/orders/[id] POST", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export const PUT = POST;
