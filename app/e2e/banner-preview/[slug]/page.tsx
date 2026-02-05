import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { renderArtistCanvasToHtml } from "@/lib/data/artists";
import type { BannerContent } from "@/components/artist/ArtistBannerCanvas";

export const dynamic = "force-dynamic";

const FALLBACK_MESSAGE =
  "Aucune bannière publiée pour cet artiste. Publiez votre canevas depuis le CMS pour alimenter la home.";

function resolveBannerContent(page: any | null): BannerContent | null {
  if (!page) return null;
  const draft = page.draftContent && Object.keys(page.draftContent).length ? page.draftContent : null;
  const published = page.publishedContent && Object.keys(page.publishedContent).length ? page.publishedContent : null;
  const status = typeof page.status === "string" ? page.status : null;
  if (status === "published") {
    return (published as BannerContent) ?? (draft as BannerContent) ?? null;
  }
  return (draft as BannerContent) ?? (published as BannerContent) ?? null;
}

type BannerPreviewPageProps = {
  params: { slug: string };
};

export default async function BannerPreviewPage({ params }: BannerPreviewPageProps) {
  const slugParam = decodeURIComponent(params.slug || "").trim();
  if (!slugParam) {
    notFound();
  }

  const artist = await prisma.artist.findFirst({
    where: {
      isActive: true,
      OR: [{ slug: slugParam }, { id: slugParam }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      biography: true,
      photoUrl: true,
      artworks: {
        take: 6,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, imageUrl: true },
      },
      user: {
        select: {
          artistPages: {
            where: { key: "banner" },
            select: {
              status: true,
              publishedContent: true,
              draftContent: true,
            },
          },
        },
      },
    },
  });

  if (!artist) {
    notFound();
  }

  const page = artist.user?.artistPages?.[0] ?? null;
  const bannerContent = resolveBannerContent(page);
  const artistContext = {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    biography: artist.biography,
    photoUrl: artist.photoUrl,
    artworks: artist.artworks ?? [],
  };

  let bannerHtml: string | null = null;
  if (bannerContent) {
    try {
      bannerHtml = renderArtistCanvasToHtml({
        artist: artistContext,
        content: bannerContent,
        pageKey: "banner",
        variant: "home",
        showBackLink: false,
      });
    } catch (error) {
      console.warn("Failed to render banner preview for", artist.slug || artist.id, error);
      bannerHtml = null;
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-100 via-slate-200/60 to-slate-100 px-6 py-10">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-300/70 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
              Comparaison CMS → Home
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Bandeau publié — {artist.name}
            </h1>
          </div>
          <div className="rounded-full border border-slate-300 bg-white px-4 py-1 text-xs font-medium text-slate-600 shadow-sm">
            slug&nbsp;: {artist.slug ?? "—"} · id&nbsp;: {artist.id}
          </div>
        </header>
        <section className="flex flex-col gap-4">
          <div className="text-sm text-slate-600">
            <p>
              Cette page e2e affiche strictement le canevas rendu en variant{" "}
              <code className="rounded bg-white/80 px-1">home</code>. Les tests Playwright comparent
              ce rendu à la carte « Ils rejoignent la galerie ».
            </p>
          </div>
          <div
            data-testid="banner-preview-frame"
            className="relative mx-auto w-full max-w-[1000px] overflow-visible rounded-[32px] bg-transparent p-0"
          >
            <div className="relative w-full overflow-hidden rounded-[32px] border border-white/30 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
              {bannerHtml ? (
                <div
                  className="artist-banner-canvas"
                  data-testid="banner-preview-html"
                  dangerouslySetInnerHTML={{ __html: bannerHtml }}
                />
              ) : (
                <div className="flex h-[320px] w-full items-center justify-center text-sm text-slate-500">
                  {FALLBACK_MESSAGE}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
