-- Chapter 3 workflows: lead/order statuses, workflow activity log, export jobs
ALTER TABLE "Lead"
  ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN "lastContactedAt" TIMESTAMP,
  ADD COLUMN "nextFollowUpAt" TIMESTAMP,
  ADD COLUMN "nextFollowUpNote" TEXT;

ALTER TABLE "Order"
  ADD COLUMN "opsStatus" TEXT NOT NULL DEFAULT 'backoffice_pending',
  ADD COLUMN "nextActionAt" TIMESTAMP,
  ADD COLUMN "nextActionNote" TEXT;

CREATE INDEX "Order_opsStatus_idx" ON "Order" ("opsStatus");
CREATE INDEX "Order_nextActionAt_idx" ON "Order" ("nextActionAt");

CREATE TABLE "WorkflowActivity" (
  "id" TEXT PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "activityType" TEXT NOT NULL,
  "payload" JSONB,
  "dueAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "authorId" TEXT,
  "authorEmail" TEXT,
  "authorName" TEXT
);

CREATE INDEX "WorkflowActivity_entityType_entityId_createdAt_idx"
  ON "WorkflowActivity" ("entityType", "entityId", "createdAt");
CREATE INDEX "WorkflowActivity_entityType_dueAt_idx"
  ON "WorkflowActivity" ("entityType", "dueAt");

CREATE TABLE "AdminExportJob" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "filters" JSONB,
  "fileName" TEXT,
  "fileMimeType" TEXT,
  "fileContent" BYTEA,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readyAt" TIMESTAMP,
  "triggeredById" TEXT,
  "triggeredByEmail" TEXT
);

CREATE INDEX "AdminExportJob_type_idx" ON "AdminExportJob" ("type");
CREATE INDEX "AdminExportJob_status_idx" ON "AdminExportJob" ("status");
CREATE INDEX "AdminExportJob_createdAt_idx" ON "AdminExportJob" ("createdAt");
