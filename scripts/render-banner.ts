import { PrismaClient } from "@prisma/client";
import { renderArtistCanvasToHtml } from "../src/lib/data/artists";

async function main() {
  const prisma = new PrismaClient();
  try {
    const artist = await prisma.artist.findFirst({
      where: { slug: "jules-paz" },
      select: {
        id: true,
        name: true,
        slug: true,
        biography: true,
        photoUrl: true,
        artworks: { take: 1, select: { id: true, title: true, imageUrl: true } },
        user: {
          select: {
            artistPages: {
              where: { key: "banner" },
              select: { draftContent: true, publishedContent: true },
            },
          },
        },
      },
    });
    if (!artist) {
      console.log("Artist not found");
      return;
    }
    const content = (artist.user?.artistPages?.[0]?.publishedContent ||
      artist.user?.artistPages?.[0]?.draftContent) as any;
    const html = renderArtistCanvasToHtml({
      artist: {
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        biography: artist.biography,
        photoUrl: artist.photoUrl,
        artworks: artist.artworks || [],
      },
      content,
      pageKey: "banner",
      variant: "home",
      showBackLink: false,
    });
    console.log(html);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
