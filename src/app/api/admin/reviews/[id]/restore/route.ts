import { NextRequest, NextResponse } from "next/server";
import { ReviewVisibility } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  REVIEW_WITH_AUTHOR,
  serializeReview,
  incrementProductAggregates,
} from "@/lib/reviews";
import {
  enforceRateLimit,
  handleRateLimitError,
  rateLimitKeyForRequest,
} from "@/lib/rate-limit";

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHENTICATED", 401, "Sign in required");
  }
  if (session.user.role !== "admin") {
    return errorResponse("FORBIDDEN", 403, "Admin access required");
  }

  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isFinite(reviewId) || reviewId <= 0) {
    return errorResponse("INVALID_INPUT", 422, "Invalid review id");
  }

  const limitResponse = applyRateLimits(req, Number(session.user.id), "moderate");
  if (limitResponse) return limitResponse;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        ...REVIEW_WITH_AUTHOR,
      });

      if (!review) return "NOT_FOUND" as const;
      if (review.visibility === ReviewVisibility.public) {
        return review;
      }

      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: { visibility: ReviewVisibility.public },
        ...REVIEW_WITH_AUTHOR,
      });

      await incrementProductAggregates(tx, review.productId, 1, review.rating);
      return updatedReview;
    });

    if (updated === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", 404, "Review not found");
    }

    return NextResponse.json({
      review: serializeReview(updated, Number(session.user.id), true),
    });
  } catch (error) {
    console.error("POST /api/admin/reviews/[id]/restore", error);
    return errorResponse("SERVER_ERROR", 500, "Unable to restore review");
  }
}

