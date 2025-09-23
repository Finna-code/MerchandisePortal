import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { z, ZodError } from "zod";

const bodySchema = z.object({ status: z.enum(["draft","placed","paid","ready","delivered","canceled"]) });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const json = await req.json();
    const { status } = bodySchema.parse(json);
    const updated = await prisma.order.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof ZodError
      ? e.issues?.[0]?.message ?? "Invalid request"
      : e instanceof Error
        ? e.message
        : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
