/*
  Warnings:

  - You are about to drop the column `config` on the `ProfileCustomization` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Artist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "profile" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "ProfileCustomization" DROP COLUMN "config",
ADD COLUMN     "content" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- AddForeignKey
ALTER TABLE "ProfileCustomization" ADD CONSTRAINT "ProfileCustomization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
