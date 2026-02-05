-- Create WebhookEvent table if it was never generated (handles legacy db push environments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'WebhookEvent'
  ) THEN
    CREATE TABLE "WebhookEvent" (
      "id" TEXT PRIMARY KEY,
      "provider" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "payload" JSONB NOT NULL,
      "eventId" TEXT,
      "receivedAt" TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS "WebhookEvent_provider_idx" ON "WebhookEvent"("provider");
    CREATE INDEX IF NOT EXISTS "WebhookEvent_type_idx" ON "WebhookEvent"("type");
    CREATE INDEX IF NOT EXISTS "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");
  END IF;
END
$$;
