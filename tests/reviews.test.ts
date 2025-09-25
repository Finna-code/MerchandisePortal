import { describe, expect, it, beforeEach, vi } from "vitest";
import { ReviewVisibility } from "@prisma/client";

import {
  incrementProductAggregates,
  sanitizeReviewBody,
  serializeReview,
  type ReviewWithAuthor,
} from "@/lib/reviews";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

describe("sanitizeReviewBody", () => {
  it("strips html tags and normalises whitespace", () => {
    const input = "<p>Hello <strong>world</strong>!<br/>This is <em>great</em>.</p>";
    expect(sanitizeReviewBody(input)).toBe("Hello world! This is great.");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeReviewBody("   Lots of space   ")).toBe("Lots of space");
  });
});

describe("incrementProductAggregates", () => {
  it("updates rating count and sum when deltas provided", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const tx = { product: { update } } as unknown as Parameters<typeof incrementProductAggregates>[0];
    await incrementProductAggregates(tx, 10, 1, 4);
    expect(update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        ratingCount: { increment: 1 },
        ratingSum: { increment: 4 },
      },
    });
  });

  it("skips update when both deltas are zero", async () => {
    const update = vi.fn();
    const tx = { product: { update } } as unknown as Parameters<typeof incrementProductAggregates>[0];
    await incrementProductAggregates(tx, 5, 0, 0);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("serializeReview", () => {
  const baseReview: ReviewWithAuthor = {
    id: 1,
    productId: 9,
    userId: 42,
    rating: 5,
    body: "Excellent",
    visibility: ReviewVisibility.public,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-02T10:00:00Z"),
    user: { id: 42, name: "Jane Doe" },
  } as ReviewWithAuthor;

  it("marks owner permissions correctly", () => {
    const result = serializeReview(baseReview, 42, false);
    expect(result.isOwner).toBe(true);
    expect(result.canEdit).toBe(true);
    expect(result.canDelete).toBe(true);
    expect(result.canModerate).toBe(false);
  });

  it("marks admin moderation", () => {
    const result = serializeReview(baseReview, 7, true);
    expect(result.isOwner).toBe(false);
    expect(result.canEdit).toBe(false);
    expect(result.canDelete).toBe(false);
    expect(result.canModerate).toBe(true);
  });

  it("prevents editing hidden reviews", () => {
    const hiddenReview = { ...baseReview, visibility: ReviewVisibility.hidden } as ReviewWithAuthor;
    const result = serializeReview(hiddenReview, 42, false);
    expect(result.canEdit).toBe(false);
  });
});

describe("rate limiting", () => {
  beforeEach(() => {
    const globalRef = globalThis as typeof globalThis & { __rateLimitStore?: unknown };
    delete globalRef.__rateLimitStore;
  });

  it("throws after exceeding the limit", () => {
    const key = "tests:rate-limit";
    for (let i = 0; i < 5; i += 1) {
      expect(() => enforceRateLimit(key, { limit: 5, windowMs: 1000 })).not.toThrow();
    }
    expect(() => enforceRateLimit(key, { limit: 5, windowMs: 1000 })).toThrow(RateLimitError);
  });
});
