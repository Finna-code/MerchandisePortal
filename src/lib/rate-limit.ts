// src/lib/rate-limit.ts
import { NextResponse } from "next/server";

const DEFAULT_WINDOW_MS = 60_000;

interface RateLimitOptions {
  limit: number;
  windowMs?: number;
}

class RateLimitStore {
  private buckets: Map<string, { count: number; expiresAt: number }> = new Map();

  bump(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const entry = this.buckets.get(key);

    if (!entry || entry.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return { remaining: limit - 1, resetMs: windowMs };
    }

    if (entry.count >= limit) {
      return { remaining: 0, resetMs: Math.max(0, entry.expiresAt - now), limited: true };
    }

    entry.count += 1;
    this.buckets.set(key, entry);
    return { remaining: limit - entry.count, resetMs: Math.max(0, entry.expiresAt - now) };
  }
}

const globalStore = (() => {
  const globalRef = globalThis as typeof globalThis & { __rateLimitStore?: RateLimitStore };
  if (!globalRef.__rateLimitStore) {
    globalRef.__rateLimitStore = new RateLimitStore();
  }
  return globalRef.__rateLimitStore;
})();

export class RateLimitError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super("Too many requests");
    this.name = "RateLimitError";
  }
}

export function enforceRateLimit(key: string, options: RateLimitOptions) {
  const limit = Math.max(1, Math.trunc(options.limit));
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const result = globalStore.bump(key, limit, windowMs);

  if ((result as { limited?: boolean }).limited) {
    throw new RateLimitError(result.resetMs);
  }

  return result;
}

export function rateLimitKeyForRequest(req: Request, action: string) {
  const headerKeys = [
    "cf-connecting-ip",
    "x-real-ip",
    "x-forwarded-for",
    "fly-client-ip",
  ];
  let identifier: string | null = null;
  for (const key of headerKeys) {
    const value = req.headers.get(key);
    if (value) {
      identifier = value.split(",")[0]?.trim();
      if (identifier) break;
    }
  }
  identifier = identifier ?? "anonymous";
  return `${action}:${identifier}`;
}

export function handleRateLimitError(error: unknown) {
  if (error instanceof RateLimitError) {
    const retrySeconds = Math.ceil(error.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: retrySeconds ? { "Retry-After": String(retrySeconds) } : undefined,
      }
    );
  }
  return null;
}


