import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { z } from "zod";

const bodySchema = z.object({ role: z.enum(["user","dept_head","admin"]) });

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const json = await req.json();
    const { role } = bodySchema.parse(json);
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    return NextResponse.json(updated);
  } catch (e: any) {
    const message = e?.issues?.[0]?.message ?? e?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
