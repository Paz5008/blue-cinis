import { prisma } from "@/lib/prisma";
import { notFound, redirect } from 'next/navigation';
import ArtistProfileView from '@/components/artist/ArtistProfileView';
import { verifyPreviewToken } from '@/lib/previewToken';

const buildArtistSelect = (includeArtworks: boolean) => ({
  id: true,
  slug: true,
  userId: true,
  name: true,
  biography: true,
  artStyle: true,
  photoUrl: true,
  ...(includeArtworks
    ? {
      artworks: {
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          price: true,
          description: true,
          artistName: true,
          isAvailable: true,
          dimensions: true,
          year: true,
        },
      },
    }
    : {}),
});



export default async function ArtistDetailPage(props: any) {
  const { params, searchParams } = props as { params: any; searchParams: Record<string, string | string[] | undefined> };
  const artist = await prisma.artist.findUnique({
    where: { id: params.id },
    select: buildArtistSelect(true),
  });
  if (!artist) notFound();
  // Canonique par slug: rediriger si un slug est défini
  if (artist.slug) {
    redirect(`/artistes/${artist.slug}`)
  }

  // Fetch Profile content
  // Charger uniquement le contenu publié pour la page 'profile'
  let content: any = {};
  if (artist.userId) {
    const page = await prisma.artistPage.findUnique({
      where: { userId_key: { userId: artist.userId, key: 'profile' } },
      select: { publishedContent: true, draftContent: true }, // Draft required for preview check? no, here we are public
    });
    content = page?.publishedContent || {};
  }

  return <ArtistProfileView artist={artist} content={content} />;
}
export async function generateMetadata(props: any) {
  const { params, searchParams } = props as { params: { id: string }, searchParams?: Record<string, string | string[] | undefined> };
  const artist = await prisma.artist.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      slug: true,
      name: true,
      biography: true,
      photoUrl: true,
      userId: true,
    },
  });
  if (!artist) return {} as any;
  let meta: any = null;
  try {
    if (artist.userId) {
      let useDraft = false;
      const rawPrev = searchParams?.preview as any;
      const token = typeof rawPrev === 'string' ? rawPrev : (Array.isArray(rawPrev) ? rawPrev[0] : undefined);
      if (token) {
        const claims = verifyPreviewToken(token);
        if (claims && claims.sub === artist.userId && (claims.key || 'profile') === 'profile') useDraft = true;
      }
      const page = await prisma.artistPage.findUnique({ where: { userId_key: { userId: artist.userId, key: 'profile' } }, select: { draftContent: true, publishedContent: true } });
      const content = page ? (useDraft ? (page as any).draftContent : (page as any).publishedContent) : null;
      meta = (content as any)?.meta || null;
    }
  } catch { }
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
  const path = `/artistes/${artist.slug || artist.id}`;
  const title = (meta?.title && String(meta.title)) || `${artist.name} — Blue Cinis`;
  const description = (meta?.description && String(meta.description)) || (artist.biography ? String(artist.biography).slice(0, 160) : undefined);
  const canonical = (meta?.canonicalUrl && String(meta.canonicalUrl)) || (base ? `${base}${path}` : undefined);
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title, description, url: canonical, images: artist.photoUrl ? [{ url: artist.photoUrl }] : undefined, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description, images: artist.photoUrl ? [artist.photoUrl] : undefined },
  } as any;
}
