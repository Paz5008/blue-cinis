-- Add isAvailable column to Artwork if missing
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- Optional: backfill nulls to true if any (defensive)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Artwork' AND column_name = 'isAvailable'
  ) THEN
    UPDATE "Artwork" SET "isAvailable" = true WHERE "isAvailable" IS NULL;
  END IF;
END $$;
