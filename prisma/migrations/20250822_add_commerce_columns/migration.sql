-- Add Stripe Connect column on Artist (nullable, unique)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Artist' AND column_name = 'stripeAccountId'
  ) THEN
    ALTER TABLE "Artist" ADD COLUMN "stripeAccountId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Artist_stripeAccountId_key'
  ) THEN
    CREATE UNIQUE INDEX "Artist_stripeAccountId_key" ON "Artist"("stripeAccountId");
  END IF;
END $$;

-- Add reservedUntil on Artwork for soft reservation
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Artwork' AND column_name = 'reservedUntil'
  ) THEN
    ALTER TABLE "Artwork" ADD COLUMN "reservedUntil" TIMESTAMP(3);
  END IF;
END $$;

-- Create Order table if not exists
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT PRIMARY KEY,
  "artworkId" TEXT NOT NULL,
  "artistId" TEXT NOT NULL,
  "buyerEmail" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "fee" INTEGER NOT NULL,
  "net" INTEGER NOT NULL,
  "stripeSessionId" TEXT NOT NULL UNIQUE,
  "paymentIntentId" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Helpful indexes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Order_artistId_idx'
  ) THEN
    CREATE INDEX "Order_artistId_idx" ON "Order"("artistId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Order_artworkId_idx'
  ) THEN
    CREATE INDEX "Order_artworkId_idx" ON "Order"("artworkId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Order_status_idx'
  ) THEN
    CREATE INDEX "Order_status_idx" ON "Order"("status");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Order_createdAt_idx'
  ) THEN
    CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
  END IF;
END $$;
