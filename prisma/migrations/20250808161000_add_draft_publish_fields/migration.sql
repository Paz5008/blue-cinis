-- Add draft/published separation to ProfileCustomization
ALTER TABLE "ProfileCustomization"
  ADD COLUMN IF NOT EXISTS "draftContent" JSONB,
  ADD COLUMN IF NOT EXISTS "publishedContent" JSONB,
  ADD COLUMN IF NOT EXISTS "status" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP;
