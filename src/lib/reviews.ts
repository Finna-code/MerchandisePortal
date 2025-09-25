import { Prisma, ReviewVisibility } from "@prisma/client";

import { prisma } from "@/lib/db";

type PrismaClientOrTx = Prisma.TransactionClient | typeof prisma;

export const REVIEW_WITH_AUTHOR = {
  include: {
    user: {
      select: {
        id: true,
        name: true,
      },
    },
  },
} satisfies Prisma.ReviewDefaultArgs;

export type ReviewWithAuthor = Prisma.ReviewGetPayload<typeof REVIEW_WITH_AUTHOR>;

const TAG_REGEX = /<[^>]*>/g;
const WHITESPACE_REGEX = /\s+/g;

export function sanitizeReviewBody(input: string): string {
  const withoutTags = input.replace(TAG_REGEX, " ");
  const normalized = withoutTags.replace(WHITESPACE_REGEX, " ").trim();
  const tightened = normalized.replace(/\s+([.,!?;:])/g, "$1");
  return tightened;
}

export function maskDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Anonymous";
  const [first, ...rest] = trimmed.split(/\s+/);
  if (rest.length === 0) {
    if (first.length <= 2) return first;
    return `${first.slice(0, 1)}${"*".repeat(Math.max(first.length - 2, 1))}${first.slice(-1)}`;
  }
  const last = rest[rest.length - 1];
  return `${first} ${last.slice(0, 1)}.`;
}

export function serializeReview(
  review: ReviewWithAuthor,
  viewerId: number | null,
  viewerIsAdmin: boolean,
) {
  const isOwner = viewerId != null && review.userId === viewerId;
  return {
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    rating: review.rating,
    body: review.body,
    visibility: review.visibility,
    createdAt: review.createdAt.toISOString(),
    author: {
      id: review.user.id,
      name: maskDisplayName(review.user.name ?? ""),
    },
    isOwner,
    canEdit: isOwner && review.visibility === ReviewVisibility.public,
    canDelete: isOwner,
    canModerate: viewerIsAdmin,
  };
}

export async function incrementProductAggregates(
  tx: PrismaClientOrTx,
  productId: number,
  countDelta: number,
  ratingDelta: number,
) {
  if (countDelta === 0 && ratingDelta === 0) return;

  const data = ({
    ...(countDelta === 0 ? {} : { ratingCount: { increment: countDelta } }),
    ...(ratingDelta === 0 ? {} : { ratingSum: { increment: ratingDelta } }),
  }) as Prisma.ProductUpdateInput;

  await tx.product.update({
    where: { id: productId },
    data,
  });
}

export async function recomputeProductAggregates(tx: PrismaClientOrTx, productId: number) {
  const aggregate = await tx.review.aggregate({
    where: { productId, visibility: ReviewVisibility.public },
    _count: { _all: true },
    _sum: { rating: true },
  });

  const data = ({
    ratingCount: { set: aggregate._count._all ?? 0 },
    ratingSum: { set: aggregate._sum.rating ?? 0 },
  }) as Prisma.ProductUpdateInput;

  await tx.product.update({
    where: { id: productId },
    data,
  });
}

export function computeAverage(ratingSum: number, ratingCount: number): number {
  if (ratingCount <= 0) return 0;
  return Math.round((ratingSum / ratingCount) * 10) / 10;
}



