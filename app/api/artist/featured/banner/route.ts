import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

// Renvoie une liste d'artistes vedettes avec leur contenu de bannière publié
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 1;
  if (isNaN(limit) || limit <= 0) {
    return NextResponse.json({ error: "Le paramètre 'limit' doit être un entier positif." }, { status: 400 });
  }
  try {
    // D'abord les artistes mis en avant
    let artists: Array<{ id: string; userId: string | null; name: string; slug: string | null; photoUrl: string | null; biography: string | null }> = [];
    try {
      artists = await prisma.artist.findMany({
        where: { isActive: true, isFeatured: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, userId: true, name: true, slug: true, photoUrl: true, biography: true },
      });
      if (artists.length < limit) {
        const remaining = limit - artists.length;
        const more = await prisma.artist.findMany({
          where: { isActive: true, isFeatured: false },
          take: remaining,
          orderBy: { createdAt: 'desc' },
          select: { id: true, userId: true, name: true, slug: true, photoUrl: true, biography: true },
        });
        artists = [...artists, ...more];
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
        console.warn('Colonne Artist.isFeatured manquante en base. Fallback sans filtre isFeatured.');
        artists = await prisma.artist.findMany({
          where: { isActive: true },
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: { id: true, userId: true, name: true, slug: true, photoUrl: true, biography: true },
        });
      } else {
        throw err;
      }
    }

    // Charger les bannières publiées (ArtistPage key='banner')
    const results: any[] = [];
    for (const a of artists) {
      let banner: any = null;
      let bannerCta: { label: string | null; href: string | null } | null = null;
      if (a.userId) {
        try {
          const page = await prisma.artistPage.findUnique({
            where: { userId_key: { userId: a.userId, key: 'banner' } },
            select: { publishedContent: true },
          });
          banner = page?.publishedContent || null;
          if (banner && typeof banner === 'object') {
            const settings = (banner as any).settings;
            if (settings && typeof settings === 'object') {
              const label = typeof settings.homeCtaLabel === 'string' ? settings.homeCtaLabel.trim() : typeof settings.ctaLabel === 'string' ? settings.ctaLabel.trim() : null;
              const hrefRaw = typeof settings.homeCtaUrl === 'string' ? settings.homeCtaUrl.trim() : typeof settings.ctaUrl === 'string' ? settings.ctaUrl.trim() : null;
              const href = hrefRaw && hrefRaw.length > 0 ? hrefRaw : null;
              if (label || href) {
                bannerCta = { label: label || null, href };
              } else if (settings.cta && typeof settings.cta === 'object') {
                const nestedLabel = typeof settings.cta.label === 'string' ? settings.cta.label.trim() : null;
                const nestedHref = typeof settings.cta.href === 'string' ? settings.cta.href.trim() : null;
                if (nestedLabel || nestedHref) {
                  bannerCta = { label: nestedLabel || null, href: nestedHref || null };
                }
              }
            }
          }
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2021' || err.code === 'P2022')) {
            // Table/colonnes des ArtistPage pas encore présentes => fallback silencieux
            banner = null;
          } else {
            throw err;
          }
        }
      }
      results.push({ artist: a, banner, cta: bannerCta });
    }
    return NextResponse.json(results, {
      status: 200,
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (e) {
    console.error('Erreur GET /api/artist/featured/banner', e);
    // Ne pas casser l'UI si la DB est indisponible: renvoyer un tableau vide
    return NextResponse.json([], { status: 200 });
  }
}
