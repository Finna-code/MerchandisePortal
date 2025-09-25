import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { z, ZodError } from "zod";

const bodySchema = z.object({ role: z.enum(["user","dept_head","admin"]) });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const json = await req.json();
    const { role } = bodySchema.parse(json);
    // Safeguard: prevent an admin from changing their own role to avoid lockout
    if (session.user.id === id && role !== "admin") {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 403 });
    }
    const updated = await prisma.user.update({ where: { id }, data: { role } });
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

