-- Create ArtistPage if it does not exist
CREATE TABLE IF NOT EXISTS "ArtistPage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "draftContent" JSONB,
  "publishedContent" JSONB,
  "status" TEXT,
  "publishedAt" TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArtistPage_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on (userId, key)
DO $$ BEGIN
  CREATE UNIQUE INDEX "ArtistPage_userId_key_key" ON "ArtistPage"("userId", "key");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "ArtistPage_userId_idx" ON "ArtistPage"("userId");
CREATE INDEX IF NOT EXISTS "ArtistPage_key_idx" ON "ArtistPage"("key");

-- Foreign key to User
DO $$ BEGIN
  ALTER TABLE "ArtistPage" ADD CONSTRAINT "ArtistPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
