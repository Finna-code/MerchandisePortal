import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { createVerificationToken, getTokenTtlMs } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";
import { getAppBaseUrl } from "@/lib/utils";
import { enforceRateLimit, handleRateLimitError, rateLimitKeyForRequest } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    enforceRateLimit(rateLimitKeyForRequest(req, "admin-invite-resend"), { limit: 20, windowMs: 60 * 1000 });
  } catch (error) {
    const response = handleRateLimitError(error);
    if (response) return response;
    throw error;
  }

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const inviteId = Number(id);
  if (!Number.isFinite(inviteId)) {
    return NextResponse.json({ error: "Invalid invite id" }, { status: 400 });
  }

  const invite = await (prisma as any).invite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
  }

  const ttl = getTokenTtlMs("invite");
  const { token, expiresAt, record } = await createVerificationToken({
    type: "invite",
    email: invite.email,
    ttlMs: ttl,
  });

  await (prisma as any).invite.update({
    where: { id: invite.id },
    data: {
      tokenHash: record.tokenHash,
      expiresAt,
      invitedById: Number(session.user.id),
    },
  });

  const inviteUrl = `${getAppBaseUrl()}/accept-invite?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: invite.email,
    subject: `You're invited as ${invite.role}`,
    html: `
      <p>Hello,</p>
      <p>This is a reminder that you have been invited to MerchPortal as <strong>${invite.role}</strong>.</p>
      <p>Click the link below to accept the invite and set your password:</p>
      <p><a href="${inviteUrl}">Accept your invite</a></p>
      <p>This link expires on ${expiresAt.toUTCString()}.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}



