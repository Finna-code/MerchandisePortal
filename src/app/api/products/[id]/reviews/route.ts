import { NextRequest, NextResponse } from "next/server";
import { Prisma, ReviewVisibility } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  REVIEW_WITH_AUTHOR,
  sanitizeReviewBody,
  serializeReview,
  incrementProductAggregates,
} from "@/lib/reviews";
import {
  enforceRateLimit,
  handleRateLimitError,
  rateLimitKeyForRequest,
} from "@/lib/rate-limit";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
type SortOption = "helpful" | "recent";

const bodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z
    .string()
    .min(1)
    .max(2_000)
    .transform((value, ctx) => {
      const sanitized = sanitizeReviewBody(value);
      if (sanitized.length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Review cannot be empty." });
        return z.NEVER;
      }
      if (sanitized.length > 1_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Review must be at most 1,000 characters after formatting is removed.",
        });
        return z.NEVER;
      }
      return sanitized;
    }),
});

function errorResponse(code: string, status: number, message?: string) {
  return NextResponse.json({ error: code, message }, { status });
}

function applyRateLimits(req: NextRequest, userId: number, action: string) {
  try {
    enforceRateLimit(rateLimitKeyForRequest(req, `reviews:${action}`), { limit: 5 });
    enforceRateLimit(`reviews:user:${userId}:${action}`, { limit: 5 });
    return null;
  } catch (error) {
    const handled = handleRateLimitError(error);
    if (handled) return handled;
    throw error;
  }
}

function parseLimit(searchParams: URLSearchParams) {
  const raw = searchParams.get("limit");
  if (!raw) return DEFAULT_LIMIT;
  const value = Number(raw);
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.trunc(value)), MAX_LIMIT);
}

function parseCursor(searchParams: URLSearchParams) {
  const raw = searchParams.get("cursor");
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.trunc(value);
}

function parseSort(searchParams: URLSearchParams): SortOption {
  const raw = (searchParams.get("sort") ?? "").toLowerCase();
  if (raw === "recent") return "recent";
  if (raw === "helpful") return "helpful";
  return "helpful";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const productId = Number(idParam);
  if (!Number.isFinite(productId) || productId <= 0) {
    return errorResponse("INVALID_INPUT", 422, "Invalid product id");
  }

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const viewerIsAdmin = session?.user?.role === "admin";

  const productExists = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!productExists) {
    return errorResponse("NOT_FOUND", 404, "Product not found");
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = parseLimit(searchParams);
  const cursor = parseCursor(searchParams);
  const sort = parseSort(searchParams);

  const where = viewerIsAdmin
    ? { productId }
    : { productId, visibility: ReviewVisibility.public };

  const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
    sort === "recent"
      ? [
          { createdAt: Prisma.SortOrder.desc },
          { id: Prisma.SortOrder.desc },
        ]
      : [
          { rating: Prisma.SortOrder.desc },
          { createdAt: Prisma.SortOrder.desc },
          { id: Prisma.SortOrder.desc },
        ];

  const reviews = await prisma.review.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    ...REVIEW_WITH_AUTHOR,
  });

  const hasMore = reviews.length > limit;
  const trimmed = hasMore ? reviews.slice(0, -1) : reviews;
  const nextCursor = hasMore ? String(trimmed[trimmed.length - 1]?.id ?? "") : null;

  let viewerReview = trimmed.find((review) => review.userId === viewerId) ?? null;
  if (!viewerReview && viewerId != null) {
    viewerReview = (await prisma.review.findFirst({
      where: {
        productId,
        userId: viewerId,
      },
      ...REVIEW_WITH_AUTHOR,
    })) as typeof viewerReview;
  }

  return NextResponse.json({
    reviews: trimmed.map((review) => serializeReview(review, viewerId, viewerIsAdmin)),
    nextCursor,
    viewerReview: viewerReview ? serializeReview(viewerReview, viewerId, viewerIsAdmin) : null,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHENTICATED", 401, "Sign in required");
  }

  const { id: idParam } = await params;
  const productId = Number(idParam);
  if (!Number.isFinite(productId) || productId <= 0) {
    return errorResponse("INVALID_INPUT", 422, "Invalid product id");
  }

  const limitResponse = applyRateLimits(req, Number(session.user.id), "create");
  if (limitResponse) return limitResponse;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return errorResponse("INVALID_INPUT", 422, "Invalid JSON body");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? "Invalid review";
    return errorResponse("INVALID_INPUT", 422, message);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    return errorResponse("NOT_FOUND", 404, "Product not found");
  }

  const existing = await prisma.review.findFirst({
    where: { productId, userId: Number(session.user.id) },
    select: { id: true },
  });
  if (existing) {
    return errorResponse("DUPLICATE_REVIEW", 409, "A review already exists for this product");
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          productId,
          userId: Number(session.user.id),
          rating: parsed.data.rating,
          body: parsed.data.body,
          visibility: ReviewVisibility.public,
        },
        ...REVIEW_WITH_AUTHOR,
      });

      await incrementProductAggregates(tx, productId, 1, parsed.data.rating);
      return review;
    });

    return NextResponse.json(
      { review: serializeReview(created, Number(session.user.id), session.user.role === "admin") },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/products/[id]/reviews", error);
    return errorResponse("SERVER_ERROR", 500, "Unable to save review");
  }
}





