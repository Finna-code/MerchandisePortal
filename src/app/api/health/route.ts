import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response("db error", { status: 500 });
  }
}

