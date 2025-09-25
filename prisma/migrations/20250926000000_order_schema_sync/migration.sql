-- Add FulfillmentType enum if missing
DO $$
BEGIN
  CREATE TYPE "public"."FulfillmentType" AS ENUM ('delivery', 'pickup');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- Ensure OrderStatus enum has all expected values
ALTER TYPE "public"."OrderStatus" ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE "public"."OrderStatus" ADD VALUE IF NOT EXISTS 'delivered';

-- Extend Order table with fulfillment and shipping details
ALTER TABLE "public"."Order"
  ADD COLUMN IF NOT EXISTS "fulfillmentType" "public"."FulfillmentType",
  ADD COLUMN IF NOT EXISTS "shippingLine1" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingLine2" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingCity" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingState" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingPincode" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "pickupSlotStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "pickupSlotEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "invoiceNo" TEXT,
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;

-- Ensure invoiceNo uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "Order_invoiceNo_key" ON "public"."Order"("invoiceNo");

-- Ensure default currency for orders
UPDATE "public"."Order" SET "currency" = COALESCE("currency", 'INR');
ALTER TABLE "public"."Order" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "public"."Order" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- Add Payment columns needed for reconciliation
ALTER TABLE "public"."Payment"
  ADD COLUMN IF NOT EXISTS "amount" INTEGER,
  ADD COLUMN IF NOT EXISTS "currency" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "public"."Payment" SET "amount" = COALESCE("amount", 0);
ALTER TABLE "public"."Payment" ALTER COLUMN "amount" SET NOT NULL;
UPDATE "public"."Payment" SET "currency" = COALESCE("currency", 'INR');
ALTER TABLE "public"."Payment" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "public"."Payment" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- Ensure updatedAt on payments uses automatic timestamps
ALTER TABLE "public"."Payment" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Create OrderEvent log table if missing
CREATE TABLE IF NOT EXISTS "public"."OrderEvent" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "byUserId" INTEGER,
  "meta" JSONB
);

-- Add foreign keys for OrderEvent table
DO $$
BEGIN
  ALTER TABLE "public"."OrderEvent"
    ADD CONSTRAINT "OrderEvent_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE "public"."OrderEvent"
    ADD CONSTRAINT "OrderEvent_byUserId_fkey"
    FOREIGN KEY ("byUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
