-- Add eventId to WebhookEvent for idempotence and enforce uniqueness per provider
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WebhookEvent' AND table_schema = current_schema()) THEN
    ALTER TABLE "WebhookEvent" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider","eventId");
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;
END $$;
