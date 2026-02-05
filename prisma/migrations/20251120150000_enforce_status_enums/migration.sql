-- Enforce enumerated workflow/status fields for leads and orders
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');
CREATE TYPE "OrderStatus" AS ENUM ('paid', 'refunded', 'disputed', 'failed');
CREATE TYPE "FulfillmentStatus" AS ENUM ('pending_shipment', 'shipped');
CREATE TYPE "OrderOpsStatus" AS ENUM ('backoffice_pending', 'awaiting_payment', 'to_ship', 'processing', 'completed', 'blocked');
CREATE TYPE "WorkflowEntityType" AS ENUM ('lead', 'order');
CREATE TYPE "WorkflowActivityType" AS ENUM ('note', 'status', 'follow_up', 'follow_up_complete', 'export');

ALTER TABLE "Lead"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LeadStatus" USING "status"::"LeadStatus",
  ALTER COLUMN "status" SET DEFAULT 'new'::"LeadStatus";

ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus" USING "status"::"OrderStatus",
  ALTER COLUMN "fulfillmentStatus" DROP DEFAULT,
  ALTER COLUMN "fulfillmentStatus" TYPE "FulfillmentStatus" USING "fulfillmentStatus"::"FulfillmentStatus",
  ALTER COLUMN "fulfillmentStatus" SET DEFAULT 'pending_shipment'::"FulfillmentStatus",
  ALTER COLUMN "opsStatus" DROP DEFAULT,
  ALTER COLUMN "opsStatus" TYPE "OrderOpsStatus" USING "opsStatus"::"OrderOpsStatus",
  ALTER COLUMN "opsStatus" SET DEFAULT 'backoffice_pending'::"OrderOpsStatus";

ALTER TABLE "WorkflowActivity"
  ALTER COLUMN "entityType" TYPE "WorkflowEntityType" USING "entityType"::"WorkflowEntityType",
  ALTER COLUMN "activityType" TYPE "WorkflowActivityType" USING "activityType"::"WorkflowActivityType";
