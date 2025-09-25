import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createVerificationToken, getTokenTtlMs } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";
import { getAppBaseUrl } from "@/lib/utils";
import { enforceRateLimit, handleRateLimitError, rateLimitKeyForRequest } from "@/lib/rate-limit";

const requestSchema = z.object({ email: z.string().email("Enter a valid email address") });

export async function POST(req: Request) {
  try {
    enforceRateLimit(rateLimitKeyForRequest(req, "request-reset"), { limit: 5, windowMs: 10 * 60 * 1000 });
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

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const ttl = getTokenTtlMs("reset");
    const { token, expiresAt } = await createVerificationToken({
      type: "reset",
      userId: user.id,
      email,
      ttlMs: ttl,
    });

    const resetUrl = `${getAppBaseUrl()}/reset?token=${encodeURIComponent(token)}`;
    await sendMail({
      to: email,
      subject: "Password reset",
      html: `
        <p>Hello ${user.name ?? "there"},</p>
        <p>You requested a password reset. Use the link below to set a new password:</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires on ${expiresAt.toUTCString()}.</p>
        <p>If you did not make this request, you can ignore this email.</p>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}




