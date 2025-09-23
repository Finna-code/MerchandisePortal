-- Cart authoritative pricing + status cleanup
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('cart','pending','paid','canceled');
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING (
  CASE "status"
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
)::"OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'cart';
DROP TYPE "OrderStatus_old";

ALTER TABLE "Order"
  ALTER COLUMN "subtotal" TYPE INTEGER USING ROUND("subtotal" * 100),
  ALTER COLUMN "tax" TYPE INTEGER USING ROUND(COALESCE("tax", 0) * 100),
  ALTER COLUMN "total" TYPE INTEGER USING ROUND("total" * 100);
ALTER TABLE "Order"
  ALTER COLUMN "subtotal" SET DEFAULT 0,
  ALTER COLUMN "tax" SET DEFAULT 0,
  ALTER COLUMN "total" SET DEFAULT 0;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "cartUserId" INTEGER;

UPDATE "Order" SET "cartUserId" = "userId" WHERE "status" = 'cart' AND "cartUserId" IS NULL;

ALTER TABLE "Order" ADD CONSTRAINT IF NOT EXISTS "Order_cartUserId_key" UNIQUE ("cartUserId");

ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "variantId" TEXT,
  ADD COLUMN IF NOT EXISTS "unitPrice" INTEGER,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "OrderItem" SET "unitPrice" = ROUND("price" * 100) WHERE "unitPrice" IS NULL;

ALTER TABLE "OrderItem" ALTER COLUMN "unitPrice" SET NOT NULL;
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "price";

CREATE UNIQUE INDEX IF NOT EXISTS "OrderItem_orderId_productId_variantId_key"
  ON "OrderItem"("orderId","productId","variantId");
