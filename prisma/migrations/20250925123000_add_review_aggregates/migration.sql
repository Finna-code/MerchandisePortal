-- AlterTable
ALTER TABLE "public"."Product"
  ADD COLUMN IF NOT EXISTS "ratingCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ratingSum" INTEGER NOT NULL DEFAULT 0;

-- Backfill aggregates from existing public reviews
WITH aggregates AS (
  SELECT "productId", COUNT(*)::INTEGER AS count, COALESCE(SUM("rating"), 0)::INTEGER AS sum
  FROM "public"."Review"
  WHERE "visibility" = 'public'
  GROUP BY "productId"
)
UPDATE "public"."Product" AS p
SET
  "ratingCount" = COALESCE(a.count, 0),
  "ratingSum" = COALESCE(a.sum, 0)
FROM aggregates AS a
WHERE p."id" = a."productId";

-- AlterTable
ALTER TABLE "public"."Review"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Ensure updatedAt reflects existing createdAt when missing
UPDATE "public"."Review" SET "updatedAt" = COALESCE("updatedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Review_productId_userId_key" ON "public"."Review"("productId", "userId");
