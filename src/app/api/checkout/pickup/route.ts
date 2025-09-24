import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { updatePickupDetails } from "@/lib/checkout-service";
import { OrderStateError } from "@/lib/orders";

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid datetime",
});

const bodySchema = z
  .object({
    orderId: z.coerce.number().int().positive(),
    version: z.coerce.number().int().nonnegative(),
    point: z.string().trim().min(2).max(120),
    slotStart: isoDate,
    slotEnd: isoDate,
  })
  .refine((data) => new Date(data.slotEnd).getTime() > new Date(data.slotStart).getTime(), {
    message: "Pickup end must be after start",
    path: ["slotEnd"],
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
      return NextResponse.json({ error: issue?.message ?? "Invalid pickup payload" }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const order = await updatePickupDetails(Number(session.user.id), {
      ...parsed,
      slotStart: new Date(parsed.slotStart),
      slotEnd: new Date(parsed.slotEnd),
    });
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("checkout/pickup", error);
    return NextResponse.json({ error: "Failed to save pickup details" }, { status: 500 });
  }
}

