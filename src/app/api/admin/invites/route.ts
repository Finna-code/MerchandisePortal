import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { createVerificationToken, getTokenTtlMs } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";
import { getAppBaseUrl } from "@/lib/utils";
import { enforceRateLimit, handleRateLimitError, rateLimitKeyForRequest } from "@/lib/rate-limit";

const inviteSchema = z.object({
  email: z.string().email({ message: "Enter a valid email" }),
  role: z.nativeEnum(Role).optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await (prisma as any).invite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(invites);
}

export async function POST(req: Request) {
  try {
    enforceRateLimit(rateLimitKeyForRequest(req, "admin-invite"), { limit: 20, windowMs: 60 * 1000 });
  } catch (error) {
    const response = handleRateLimitError(error);
    if (response) return response;
    throw error;
  }

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const role = parsed.data.role ?? Role.user;

  const existingUser = (await prisma.user.findUnique({ where: { email } })) as { id: number; emailVerifiedAt: Date | null } | null;
  if (existingUser?.emailVerifiedAt) {
    return NextResponse.json({ error: "User already exists with this email." }, { status: 409 });
  }

  const ttl = getTokenTtlMs("invite");
  let token: string | undefined;
  let expiresAt: Date | undefined;

  await prisma.$transaction(async (tx) => {
    const created = await createVerificationToken({
      type: "invite",
      email,
      ttlMs: ttl,
      tx,
    });

    token = created.token;
    expiresAt = created.expiresAt;

    await (tx as any).invite.upsert({
      where: { email },
      create: {
        email,
        role,
        invitedById: Number(session.user.id),
        tokenHash: created.record.tokenHash,
        expiresAt: created.expiresAt,
      },
      update: {
        role,
        invitedById: Number(session.user.id),
        tokenHash: created.record.tokenHash,
        expiresAt: created.expiresAt,
        acceptedAt: null,
      },
    });

    if (existingUser && !existingUser.emailVerifiedAt) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { role },
      });
    }
  });

  if (!token || !expiresAt) {
    return NextResponse.json({ error: "Failed to issue invite token" }, { status: 500 });
  }

  const inviteUrl = `${getAppBaseUrl()}/accept-invite?token=${encodeURIComponent(token)}`;
  const expiryText = expiresAt.toUTCString();

  await sendMail({
    to: email,
    subject: `You're invited as ${role}`,
    html: `
      <p>Hello,</p>
      <p>You have been invited to MerchPortal as <strong>${role}</strong>.</p>
      <p>Click the link below to accept the invite and set your password:</p>
      <p><a href="${inviteUrl}">Accept your invite</a></p>
      <p>This link expires on ${expiryText}.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}







