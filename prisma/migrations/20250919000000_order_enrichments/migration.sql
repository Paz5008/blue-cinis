-- Order enrichments: buyer info, tax/shipping, fulfillment, addresses
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "buyerName" TEXT,
  ADD COLUMN IF NOT EXISTS "buyerPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "tax" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "shipping" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "fulfillmentStatus" TEXT NOT NULL DEFAULT 'pending_shipment',
  ADD COLUMN IF NOT EXISTS "fulfilledAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "billingAddress" JSONB,
  ADD COLUMN IF NOT EXISTS "shippingAddress" JSONB;

CREATE INDEX IF NOT EXISTS "Order_fulfillmentStatus_idx" ON "Order" ("fulfillmentStatus");
