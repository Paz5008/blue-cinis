-- Add enableCommerce and enableLeads to Artist
ALTER TABLE "Artist"
  ADD COLUMN IF NOT EXISTS "enableCommerce" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "enableLeads" BOOLEAN NOT NULL DEFAULT true;
