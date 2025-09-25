import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const payload = (users as unknown as Array<{
    id: number;
    name: string | null;
    email: string;
    role: string;
    deptId: number | null;
    createdAt: Date;
    emailVerifiedAt: Date | null;
  }>).map(({ id, name, email, role, deptId, createdAt, emailVerifiedAt }) => ({
    id,
    name,
    email,
    role,
    deptId,
    createdAt,
    emailVerifiedAt,
  }));

  return NextResponse.json(payload);
}


