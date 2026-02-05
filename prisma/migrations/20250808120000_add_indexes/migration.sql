-- Add indexes to improve common filters and sorts
-- Note: Safe to run multiple times if the index names are unique.

-- User
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Artist
CREATE INDEX IF NOT EXISTS "Artist_createdAt_idx" ON "Artist"("createdAt");
CREATE INDEX IF NOT EXISTS "Artist_isActive_idx" ON "Artist"("isActive");
CREATE INDEX IF NOT EXISTS "Artist_artStyle_idx" ON "Artist"("artStyle");

-- Artwork
CREATE INDEX IF NOT EXISTS "Artwork_artistId_idx" ON "Artwork"("artistId");
CREATE INDEX IF NOT EXISTS "Artwork_categoryId_idx" ON "Artwork"("categoryId");
CREATE INDEX IF NOT EXISTS "Artwork_createdAt_idx" ON "Artwork"("createdAt");

-- Event
CREATE INDEX IF NOT EXISTS "Event_date_idx" ON "Event"("date");

-- BlogPost
CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_createdAt_idx" ON "BlogPost"("createdAt");
