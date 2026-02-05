-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activationToken" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;
