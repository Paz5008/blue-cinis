CREATE TABLE "BannerCtaMetric" (
  "id" TEXT NOT NULL,
  "artistId" TEXT NOT NULL,
  "ctaKey" TEXT NOT NULL,
  "ctaLabel" TEXT,
  "ctaHref" TEXT NOT NULL,
  "placement" TEXT,
  "presetId" TEXT,
  "source" TEXT,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BannerCtaMetric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BannerCtaMetric_artistId_ctaKey_date_key" ON "BannerCtaMetric"("artistId", "ctaKey", "date");
CREATE INDEX "BannerCtaMetric_artistId_date_idx" ON "BannerCtaMetric"("artistId", "date");

ALTER TABLE "BannerCtaMetric"
  ADD CONSTRAINT "BannerCtaMetric_artistId_fkey"
  FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
