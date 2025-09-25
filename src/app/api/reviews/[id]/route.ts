import { NextRequest, NextResponse } from "next/server";
import { ReviewVisibility } from "@prisma/client";
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHENTICATED", 401, "Sign in required");
  }

  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isFinite(reviewId) || reviewId <= 0) {
    return errorResponse("INVALID_INPUT", 422, "Invalid review id");
  }

  const limitResponse = applyRateLimits(req, Number(session.user.id), "update");
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

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.review.findUnique({
        where: { id: reviewId },
        ...REVIEW_WITH_AUTHOR,
      });

      if (!existing) {
        return "NOT_FOUND" as const;
      }

      if (existing.userId !== Number(session.user.id)) {
        return "FORBIDDEN" as const;
      }

      if (existing.visibility !== ReviewVisibility.public) {
        return "NOT_PUBLIC" as const;
      }

      const ratingDelta = parsed.data.rating - existing.rating;

      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: parsed.data.rating,
          body: parsed.data.body,
        },
        ...REVIEW_WITH_AUTHOR,
      });

      if (ratingDelta !== 0) {
        await incrementProductAggregates(tx, existing.productId, 0, ratingDelta);
      }

      return updatedReview;
    });

    if (updated === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", 404, "Review not found");
    }

    if (updated === "FORBIDDEN") {
      return errorResponse("FORBIDDEN", 403, "You cannot edit this review");
    }

    if (updated === "NOT_PUBLIC") {
      return errorResponse("FORBIDDEN", 403, "Hidden reviews cannot be edited");
    }

    return NextResponse.json({
      review: serializeReview(updated, Number(session.user.id), session.user.role === "admin"),
    });
  } catch (error) {
    console.error("PUT /api/reviews/[id]", error);
    return errorResponse("SERVER_ERROR", 500, "Unable to update review");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHENTICATED", 401, "Sign in required");
  }

  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isFinite(reviewId) || reviewId <= 0) {
    return errorResponse("INVALID_INPUT", 422, "Invalid review id");
  }

  const limitResponse = applyRateLimits(req, Number(session.user.id), "delete");
  if (limitResponse) return limitResponse;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.review.findUnique({
        where: { id: reviewId },
      });

      if (!existing) {
        return "NOT_FOUND" as const;
      }

      if (existing.userId !== Number(session.user.id)) {
        return "FORBIDDEN" as const;
      }

      await tx.review.delete({ where: { id: reviewId } });

      if (existing.visibility === ReviewVisibility.public) {
        await incrementProductAggregates(tx, existing.productId, -1, -existing.rating);
      }

      return "DELETED" as const;
    });

    if (result === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", 404, "Review not found");
    }

    if (result === "FORBIDDEN") {
      return errorResponse("FORBIDDEN", 403, "You cannot delete this review");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/reviews/[id]", error);
    return errorResponse("SERVER_ERROR", 500, "Unable to delete review");
  }
}


