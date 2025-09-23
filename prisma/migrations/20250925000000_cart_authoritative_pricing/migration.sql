-- Cart authoritative pricing + status refactor
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('cart', 'pending', 'paid', 'canceled');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Order" ALTER COLUMN "status" TYPE "public"."OrderStatus_new" USING (
  CASE "status"::text
    WHEN 'draft' THEN 'cart'
    WHEN 'placed' THEN 'pending'
    WHEN 'ready' THEN 'pending'
    WHEN 'delivered' THEN 'paid'
    WHEN 'cart' THEN 'cart'
    WHEN 'pending' THEN 'pending'
    WHEN 'paid' THEN 'paid'
    WHEN 'canceled' THEN 'canceled'
    ELSE 'pending'
  END
)::"public"."OrderStatus_new";
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "public"."Order" ALTER COLUMN "status" SET DEFAULT 'cart';
COMMIT;

ALTER TABLE "public"."Order"
  ALTER COLUMN "subtotal" TYPE INTEGER USING ROUND(COALESCE("subtotal", 0) * 100),
  ALTER COLUMN "tax" TYPE INTEGER USING ROUND(COALESCE("tax", 0) * 100),
  ALTER COLUMN "total" TYPE INTEGER USING ROUND(COALESCE("total", 0) * 100),
  ALTER COLUMN "subtotal" SET DEFAULT 0,
  ALTER COLUMN "tax" SET DEFAULT 0,
  ALTER COLUMN "total" SET DEFAULT 0;

ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "cartUserId" INTEGER;

UPDATE "public"."Order" SET "currency" = COALESCE("currency", 'INR');
UPDATE "public"."Order" SET "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);
UPDATE "public"."Order" SET "cartUserId" = "userId" WHERE "status" = 'cart' AND "cartUserId" IS NULL;

ALTER TABLE "public"."Order" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "public"."Order" ALTER COLUMN "currency" SET DEFAULT 'INR';
ALTER TABLE "public"."Order" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "public"."Order" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "Order_cartUserId_key";
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_cartUserId_key" UNIQUE ("cartUserId");

ALTER TABLE "public"."OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "public"."OrderItem" ADD COLUMN IF NOT EXISTS "unitPrice" INTEGER;
ALTER TABLE "public"."OrderItem" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "public"."OrderItem" ADD COLUMN IF NOT EXISTS "capturedAt" TIMESTAMP(3);

UPDATE "public"."OrderItem" SET "unitPrice" = COALESCE("unitPrice", ROUND(COALESCE("price", 0) * 100));
UPDATE "public"."OrderItem" SET "currency" = COALESCE("currency", 'INR');
UPDATE "public"."OrderItem" SET "capturedAt" = COALESCE("capturedAt", CURRENT_TIMESTAMP);

ALTER TABLE "public"."OrderItem" ALTER COLUMN "unitPrice" SET NOT NULL;
ALTER TABLE "public"."OrderItem" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "public"."OrderItem" ALTER COLUMN "currency" SET DEFAULT 'INR';
ALTER TABLE "public"."OrderItem" ALTER COLUMN "capturedAt" SET NOT NULL;
ALTER TABLE "public"."OrderItem" ALTER COLUMN "capturedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."OrderItem" DROP COLUMN IF EXISTS "price";

CREATE UNIQUE INDEX IF NOT EXISTS "OrderItem_orderId_productId_variantId_key" ON "public"."OrderItem"("orderId", "productId", "variantId");

