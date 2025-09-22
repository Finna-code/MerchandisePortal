-- AlterEnum
ALTER TYPE "public"."OrderStatus" ADD VALUE 'cart';

-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "status" SET DEFAULT 'cart';
