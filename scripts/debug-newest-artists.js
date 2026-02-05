#!/usr/bin/env node
/**
 * Utility to inspect the data powering the home "Ils rejoignent la galerie" carousel.
 * Run with `node scripts/debug-newest-artists.js` (uses DATABASE_URL from your env).
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const artists = await prisma.artist.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      user: {
        select: {
          email: true,
          artistPages: {
            where: { key: { in: ["banner"] } },
            select: {
              key: true,
              status: true,
              publishedAt: true,
              draftContent: true,
              publishedContent: true,
            },
          },
        },
      },
    },
  });

  if (!artists.length) {
    console.log("No active artists found. The homepage will fall back to static demo cards.");
    return;
  }

  console.log(`Found ${artists.length} active artist(s):\n`);
  for (const artist of artists) {
    console.log(`• ${artist.name} (id=${artist.id}, slug=${artist.slug}, createdAt=${artist.createdAt.toISOString()})`);
    console.log(`  Linked account: ${artist.user?.email ?? "—"}`);
    const bannerPage = artist.user?.artistPages?.[0];
    if (bannerPage) {
      console.log(
        `  Banner page status=${bannerPage.status ?? "draft"} publishedAt=${
          bannerPage.publishedAt ? new Date(bannerPage.publishedAt).toISOString() : "—"
        }`
      );
      const content = bannerPage.publishedContent || bannerPage.draftContent;
      if (content?.settings) {
        console.log(
          `  settings.bannerPresetId=${content.settings.bannerPresetId ?? "—"} heading="${content.settings.heading ?? "—"}"`
        );
      }
    } else {
      console.log("  (no banner page saved yet)");
    }
    console.log("");
  }
}

main()
  .catch((error) => {
    console.error("Failed to query artists:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
