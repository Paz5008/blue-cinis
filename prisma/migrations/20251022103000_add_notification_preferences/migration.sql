-- Add notification preferences field for artists
ALTER TABLE "Artist"
ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;
