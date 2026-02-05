-- Add missing isFeatured column to Artist and an index for it
-- This aligns the database with the Prisma schema, which declares `isFeatured Boolean @default(false)`

ALTER TABLE "Artist"
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Create index to optimize common filters
CREATE INDEX IF NOT EXISTS "Artist_isFeatured_idx" ON "Artist"("isFeatured");
