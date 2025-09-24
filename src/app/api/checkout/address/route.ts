import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { updateDeliveryDetails } from "@/lib/checkout-service";
import { OrderStateError } from "@/lib/orders";

const bodySchema = z.object({
  orderId: z.coerce.number().int().positive(),
  version: z.coerce.number().int().nonnegative(),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^\d{6}$/),
  phone: z.string().trim().regex(/^[+]?\d{10,15}$/),
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
      return NextResponse.json({ error: issue?.message ?? "Invalid address payload" }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const order = await updateDeliveryDetails(Number(session.user.id), parsed);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("checkout/address", error);
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}

