-- Ensure column exists before dropping default
ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "updatedAt" DROP DEFAULT;
