-- Add essential e-commerce settings to Artist
ALTER TABLE "Artist"
  ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "allowInternationalShipping" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "defaultShippingFee" INTEGER,
  ADD COLUMN IF NOT EXISTS "processingTimeDays" INTEGER;
