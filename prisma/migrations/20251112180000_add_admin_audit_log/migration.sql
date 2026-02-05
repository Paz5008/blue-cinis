-- Admin audit trail for backoffice actions
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog" ("createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_idx" ON "AdminAuditLog" ("action");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_idx" ON "AdminAuditLog" ("actorId");
