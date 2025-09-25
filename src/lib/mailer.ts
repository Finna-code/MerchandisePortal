// src/lib/mailer.ts
import nodemailer from "nodemailer";

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
}

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_SECURE,
  EMAIL_FROM,
  RESEND_API_KEY,
  RESEND_FROM,
} = process.env;

const defaultFrom = EMAIL_FROM ?? "MerchPortal <no-reply@localhost>";

const smtpTransport = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? Number(SMTP_PORT) : 587,
      secure: SMTP_SECURE === "true" || (!SMTP_SECURE && Number(SMTP_PORT ?? 0) === 465),
      auth:
        SMTP_USERNAME && SMTP_PASSWORD
          ? {
              user: SMTP_USERNAME,
              pass: SMTP_PASSWORD,
            }
          : undefined,
    })
  : null;

async function sendViaResend(payload: MailPayload) {
  if (!RESEND_API_KEY) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM ?? defaultFrom,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Resend sendMail error", response.status, text);
    return false;
  }
  return true;
}

function logMail(payload: MailPayload) {
  const preview = [
    "\n--- Email Preview ---",
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    payload.html,
    "--- End Email Preview ---\n",
  ].join("\n");
  console.info(preview);
}

export async function sendMail(payload: MailPayload) {
  if (!payload.to || !payload.subject) {
    throw new Error("sendMail requires both 'to' and 'subject'.");
  }

  const mail = { ...payload, from: defaultFrom };

  try {
    if (RESEND_API_KEY) {
      const sent = await sendViaResend(payload);
      if (sent) return;
    }

    if (smtpTransport) {
      await smtpTransport.sendMail(mail);
      return;
    }
  } catch (error) {
    console.error("sendMail transport error", error);
  }

  logMail(payload);
}


