// src/lib/tokens.ts
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_TOKEN_BYTES = 32;

export type TokenType = "verify" | "reset" | "invite";

export interface CreateTokenOptions {
  type: TokenType;
  userId?: number;
  email?: string;
  ttlMs: number;
  tx?: Prisma.TransactionClient;
}

export type ConsumeTokenResult = {
  id: number;
  type: TokenType;
  tokenHash: string;
  email: string | null;
  userId: number | null;
  expiresAt: Date;
  createdAt: Date;
};

function getPrismaClient(tx?: Prisma.TransactionClient) {
  return tx ?? prisma;
}

export function generateToken(byteLength = DEFAULT_TOKEN_BYTES) {
  return crypto.randomBytes(byteLength).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(options: CreateTokenOptions) {
  const { type, userId, email, ttlMs, tx } = options;
  if (!userId && !email) {
    throw new Error("createVerificationToken requires a userId or email");
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);
  const client = getPrismaClient(tx) as any;

  const where: any = { type };
  if (typeof userId === "number") {
    where.userId = userId;
  } else if (email) {
    where.email = email;
  }

  await client.verificationToken.deleteMany({ where });

  const created = await client.verificationToken.create({
    data: {
      type,
      tokenHash,
      userId,
      email,
      expiresAt,
    },
  });

  return { token, expiresAt, record: created };
}

export async function consumeVerificationToken(
  type: TokenType,
  token: string,
  tx?: Prisma.TransactionClient
): Promise<ConsumeTokenResult | null> {
  const tokenHash = hashToken(token);

  if (tx) {
    const txClient = tx as any;

    const record = await txClient.verificationToken.findUnique({ where: { tokenHash } });
    if (!record || record.type !== type) return null;
    if (record.expiresAt.getTime() <= Date.now()) {
      await txClient.verificationToken.delete({ where: { id: record.id } });
      return null;
    }
    await txClient.verificationToken.delete({ where: { id: record.id } });
    return record as ConsumeTokenResult;
  }

  return prisma.$transaction(async (trx) => {
    const record = await (trx as any).verificationToken.findUnique({ where: { tokenHash } });
    if (!record || record.type !== type) return null;
    if (record.expiresAt.getTime() <= Date.now()) {
      await (trx as any).verificationToken.delete({ where: { id: record.id } });
      return null;
    }
    await (trx as any).verificationToken.delete({ where: { id: record.id } });
    return record as ConsumeTokenResult;
  });
}

export function getTokenTtlMs(type: TokenType) {
  switch (type) {
    case "verify":
    case "invite":
      return 48 * 60 * 60 * 1000; // 48 hours
    case "reset":
      return 60 * 60 * 1000; // 1 hour
    default:
      return 60 * 60 * 1000;
  }
}


