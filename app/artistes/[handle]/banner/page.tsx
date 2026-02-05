import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ArtistBannerCanvas,
  type ArtistContext,
  type BannerContent,
} from "@/components/artist/ArtistBannerCanvas";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { handle: string };
  searchParams: Record<string, string | string[] | undefined>;
};

async function findArtistByHandle(handle: string) {
  const normalized = (handle || "").trim();
  if (!normalized) return null;
  return prisma.artist.findFirst({
    where: {
      OR: [{ slug: normalized }, { id: normalized }],
    },
    include: { artworks: true, user: { select: { id: true } } },
  });
}

export default async function ArtistBannerPage({ params, searchParams }: PageProps) {
  const artist = await findArtistByHandle(params.handle);
  if (!artist) notFound();
  if (artist.slug && artist.slug !== params.handle) {
    redirect(`/artistes/${artist.slug}/banner`);
  }

  let content: BannerContent | null = null;
  if (artist.userId) {
    try {
      const page = await prisma.artistPage.findUnique({
        where: { userId_key: { userId: artist.userId, key: "banner" } },
        select: { publishedContent: true },
      });
      content = page?.publishedContent as BannerContent | null;
    } catch {
      content = null;
    }
  }

  const artistContext: ArtistContext = {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    biography: artist.biography,
    photoUrl: artist.photoUrl,
    artworks: artist.artworks ?? [],
  };

  return (
    <ArtistBannerCanvas
      artist={artistContext}
      content={content}
      searchParams={searchParams}
      variant="standalone"
      showBackLink
    />
  );
}
