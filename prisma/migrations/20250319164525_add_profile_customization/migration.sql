-- CreateTable
CREATE TABLE "ProfileCustomization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileCustomization_userId_key" ON "ProfileCustomization"("userId");
