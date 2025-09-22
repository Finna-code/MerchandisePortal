import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { z } from "zod";

const bodySchema = z.object({ status: z.enum(["draft","placed","paid","ready","delivered","canceled"]) });

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const json = await req.json();
    const { status } = bodySchema.parse(json);
    const updated = await prisma.order.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
  } catch (e: any) {
    const message = e?.issues?.[0]?.message ?? e?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
