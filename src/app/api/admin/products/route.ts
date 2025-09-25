import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { z, ZodError } from "zod";
import { CATEGORIES } from "@/constants/categories";

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().nonnegative(),
  currency: z.string().default("INR"),
  images: z.array(z.string().url()).default([]),
  // whitelist category values using the CATEGORIES constant
  category: z.enum(CATEGORIES),
  stock: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createProductSchema.parse(body);
    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        price: parsed.price,
        currency: parsed.currency,
        images: parsed.images,
        category: parsed.category,
        stock: parsed.stock,
        active: parsed.active,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof ZodError
      ? e.issues?.[0]?.message ?? "Invalid request"
      : e instanceof Error
        ? e.message
        : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

