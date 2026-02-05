/*
  Warnings:

  - You are about to drop the column `bio` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `profile` on the `Artist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Artist"
DROP COLUMN IF EXISTS "bio",
DROP COLUMN IF EXISTS "profile";

-- AlterTable
ALTER TABLE "public"."ArtistPage" ALTER COLUMN "publishedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."BannerCtaMetric" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Lead" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "fulfilledAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."ProfileCustomization" ALTER COLUMN "publishedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Reservation" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "activationTokenExpiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "resetTokenExpiresAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Variant" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."WebhookEvent" ALTER COLUMN "receivedAt" SET DATA TYPE TIMESTAMP(3);
