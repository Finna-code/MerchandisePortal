import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/tokens";
import { enforceRateLimit, handleRateLimitError, rateLimitKeyForRequest } from "@/lib/rate-limit";

const acceptSchema = z.object({
  token: z.string().min(10, "Missing invite token"),
  name: z.string().trim().min(2, "Name is required").max(120),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    enforceRateLimit(rateLimitKeyForRequest(req, "accept-invite"), { limit: 10, windowMs: 10 * 60 * 1000 });
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

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const record = await consumeVerificationToken("invite", parsed.data.token);
  if (!record) {
    return NextResponse.json({ error: "This invite link is invalid or has expired." }, { status: 400 });
  }

  const invite = await (prisma as any).invite.findUnique({ where: { tokenHash: record.tokenHash } });

  if (!invite) {
    return NextResponse.json({ error: "Invite record not found." }, { status: 400 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "This invite has already been accepted." }, { status: 400 });
  }

  const email = (invite.email ?? record.email ?? "").toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Invite email missing." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.findUnique({ where: { email } });
  const now = new Date();

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: ({
        name: parsed.data.name,
        passwordHash,
        role: invite.role,
        emailVerifiedAt: now,
      }) as any,
    });
  } else {
    await prisma.user.create({
      data: ({
        name: parsed.data.name,
        email,
        passwordHash,
        role: invite.role,
        emailVerifiedAt: now,
      }) as any,
    });
  }

  await (prisma as any).invite.update({
    where: { id: invite.id },
    data: {
      acceptedAt: now,
      expiresAt: now,
      tokenHash: record.tokenHash,
    },
  });

  return NextResponse.json({ ok: true });
}





