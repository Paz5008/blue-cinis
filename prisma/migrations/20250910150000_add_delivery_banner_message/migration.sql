-- Add optional delivery banner message to Artist
ALTER TABLE "Artist"
ADD COLUMN IF NOT EXISTS "deliveryBannerMessage" TEXT;
