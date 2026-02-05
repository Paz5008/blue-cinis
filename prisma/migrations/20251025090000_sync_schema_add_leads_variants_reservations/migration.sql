-- Create Lead table if missing
CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT,
  "artworkId" TEXT,
  "artistId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Variant table with FK to Artwork
CREATE TABLE IF NOT EXISTS "Variant" (
  "id" TEXT PRIMARY KEY,
  "artworkId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceOverride" INTEGER,
  "stockQuantity" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Variant_artworkId_idx" ON "Variant"("artworkId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Variant' AND constraint_name = 'Variant_artworkId_fkey'
  ) THEN
    ALTER TABLE "Variant"
      ADD CONSTRAINT "Variant_artworkId_fkey"
      FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- Create Reservation table with relations
CREATE TABLE IF NOT EXISTS "Reservation" (
  "id" TEXT PRIMARY KEY,
  "artworkId" TEXT NOT NULL,
  "variantId" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "stripeSessionId" TEXT UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'active',
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Reservation_artworkId_idx" ON "Reservation"("artworkId");
CREATE INDEX IF NOT EXISTS "Reservation_variantId_idx" ON "Reservation"("variantId");
CREATE INDEX IF NOT EXISTS "Reservation_expiresAt_idx" ON "Reservation"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Reservation' AND constraint_name = 'Reservation_artworkId_fkey'
  ) THEN
    ALTER TABLE "Reservation"
      ADD CONSTRAINT "Reservation_artworkId_fkey"
      FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Reservation' AND constraint_name = 'Reservation_variantId_fkey'
  ) THEN
    ALTER TABLE "Reservation"
      ADD CONSTRAINT "Reservation_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- Artwork adjustments
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER;
ALTER TABLE "Artwork" ALTER COLUMN "stockQuantity" SET DEFAULT 1;
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "reservedUntil" TIMESTAMP;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Artwork' AND column_name = 'reservedUntil'
  ) THEN
    CREATE INDEX IF NOT EXISTS "Artwork_reservedUntil_idx" ON "Artwork"("reservedUntil");
  END IF;
END $$;

-- Order adjustments
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
CREATE INDEX IF NOT EXISTS "Order_variantId_idx" ON "Order"("variantId");
ALTER TABLE "Order" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "fulfilledAt" TYPE TIMESTAMP USING "fulfilledAt"::timestamp;

-- ProfileCustomization / ArtistPage timestamp normalization
ALTER TABLE "ProfileCustomization" ALTER COLUMN "publishedAt" TYPE TIMESTAMP USING "publishedAt"::timestamp;
ALTER TABLE "ArtistPage" ALTER COLUMN "publishedAt" TYPE TIMESTAMP USING "publishedAt"::timestamp;

-- User token expirations to timestamp
ALTER TABLE "User" ALTER COLUMN "activationTokenExpiresAt" TYPE TIMESTAMP USING "activationTokenExpiresAt"::timestamp;
ALTER TABLE "User" ALTER COLUMN "resetTokenExpiresAt" TYPE TIMESTAMP USING "resetTokenExpiresAt"::timestamp;

-- WebhookEvent normalization
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WebhookEvent' AND table_schema = current_schema()) THEN
    ALTER TABLE "WebhookEvent" ALTER COLUMN "receivedAt" SET NOT NULL;
    ALTER TABLE "WebhookEvent" ALTER COLUMN "receivedAt" SET DEFAULT NOW();
  END IF;
END $$;
