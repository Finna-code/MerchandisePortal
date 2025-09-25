import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/tokens";
import { enforceRateLimit, handleRateLimitError, rateLimitKeyForRequest } from "@/lib/rate-limit";

const verifySchema = z.object({
  token: z.string().min(10, "Missing verification token"),
});

export async function POST(req: Request) {
  try {
    enforceRateLimit(rateLimitKeyForRequest(req, "verify"), { limit: 10, windowMs: 5 * 60 * 1000 });
  } catch (error) {
    const response = handleRateLimitError(error);
    if (response) return response;
    throw error;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const record = await consumeVerificationToken("verify", parsed.data.token);
  if (!record) {
    return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
  }

  if (!record.userId && !record.email) {
    return NextResponse.json({ error: "Verification token is misconfigured." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: record.userId ? { id: record.userId } : { email: record.email! },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: ({ emailVerifiedAt: new Date() }) as any,
  });

  return NextResponse.json({ ok: true });
}





