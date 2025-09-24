import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createRazorpayOrderIntent } from "@/lib/payment-service";
import { OrderStateError, StockConflictError, summarizeStockConflicts } from "@/lib/orders";

const bodySchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  try {
    const response = await createRazorpayOrderIntent(parsed.orderId, Number(session.user.id));
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof StockConflictError) {
      return NextResponse.json(
        { error: "Insufficient stock", detail: summarizeStockConflicts(error.conflicts) },
        { status: 409 },
      );
    }

    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("payments/razorpay/order", error);
    return NextResponse.json({ error: "Failed to prepare payment" }, { status: 500 });
  }
}

