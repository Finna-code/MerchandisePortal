import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createVerificationToken, getTokenTtlMs } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";
import { getAppBaseUrl } from "@/lib/utils";
import { enforceRateLimit, handleRateLimitError, rateLimitKeyForRequest } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    enforceRateLimit(rateLimitKeyForRequest(req, "register"), {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const { name, password } = parsed.data;

  const existingUser = (await prisma.user.findUnique({ where: { email } })) as { id: number; emailVerifiedAt: Date | null } | null;
  if (existingUser?.emailVerifiedAt) {
    return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const ttl = getTokenTtlMs("verify");

  let token: string | undefined;
  let expiresAt: Date | undefined;

  await prisma.$transaction(async (tx) => {
    let userId: number;

    if (existingUser) {
      const updated = await tx.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          passwordHash,
        },
      });
      userId = updated.id;
    } else {
      const created = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "user",
        },
      });
      userId = created.id;
    }

    const { token: rawToken, expiresAt: expiry } = await createVerificationToken({
      type: "verify",
      userId,
      email,
      ttlMs: ttl,
      tx,
    });

    token = rawToken;
    expiresAt = expiry;
  });

  if (!token || !expiresAt) {
    return NextResponse.json({ error: "Failed to create verification token" }, { status: 500 });
  }

  const verificationUrl = `${getAppBaseUrl()}/verify?token=${encodeURIComponent(token)}`;
  const expiryText = expiresAt.toUTCString();
  await sendMail({
    to: email,
    subject: "Verify your email",
    html: `
      <p>Hi ${name.split(" ").slice(0, 1).join(" ") || "there"},</p>
      <p>Thanks for signing up to MerchPortal. Please verify your email by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify your email</a></p>
      <p>This link expires on ${expiryText}.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}




