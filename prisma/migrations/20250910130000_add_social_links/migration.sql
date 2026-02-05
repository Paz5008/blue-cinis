-- Add social link fields to Artist
ALTER TABLE "Artist"
  ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
