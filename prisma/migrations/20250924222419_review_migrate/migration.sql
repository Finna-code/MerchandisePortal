-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Payment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Review" ALTER COLUMN "updatedAt" DROP DEFAULT;
