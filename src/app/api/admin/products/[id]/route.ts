import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { z, ZodError } from "zod";
import type { Prisma } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().min(1).optional(),
  stock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const body = await _req.json();
    const data = updateSchema.parse(body);
    const update: Partial<Prisma.ProductUpdateInput> = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      currency: data.currency,
      images: data.images,
      category: data.category,
      stock: data.stock,
      active: data.active,
    };
    const updated = await prisma.product.update({ where: { id }, data: update });
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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Soft delete: set active to false
  const updated = await prisma.product.update({ where: { id }, data: { active: false } });
  return NextResponse.json(updated);
}
