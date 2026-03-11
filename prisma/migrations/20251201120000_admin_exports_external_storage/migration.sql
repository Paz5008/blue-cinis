-- Move admin export payloads out of Postgres to external storage.
ALTER TABLE "AdminExportJob"
  DROP COLUMN IF EXISTS "fileContent",
  ADD COLUMN     "fileSize" INTEGER,
  ADD COLUMN     "fileChecksum" TEXT,
  ADD COLUMN     "fileStorageProvider" TEXT,
  ADD COLUMN     "fileStorageKey" TEXT,
  ADD COLUMN     "fileStorageUrl" TEXT;
