import { NextRequest, NextResponse } from 'next/server';
import { ensureArtistProfile } from '@/lib/artist-profile';
import { signPreviewToken } from '@/lib/previewToken';
import { ensureArtistSession } from '@/lib/artistGuard';

// GET /api/artist/preview-token/[key]
// Génère un jeton de prévisualisation (brouillon) temporaire pour la page clé donnée
export async function GET(req: NextRequest, { params }: { params: { key: string } | Promise<{ key: string }> }) {
  const session = await ensureArtistSession({ allowAdmin: true });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { key: rawKey } = await (params as any);
  const key = (rawKey || 'profile').toLowerCase();
  // Vérifier que l'utilisateur est bien un artiste existant (facultatif mais utile pour construire l'URL)
  const artist = await ensureArtistProfile(session, {
    select: { id: true, slug: true },
  });
  const ttl = Math.max(60, Math.min(60 * 60, parseInt(String(req.nextUrl.searchParams.get('ttl') || '900'), 10)));
  const token = signPreviewToken(session.user.id, key, ttl);
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
  const publicPath = artist ? `/artistes/${artist.slug || artist.id}` : '/artistes';
  const previewUrl = `${base}${publicPath}?preview=${encodeURIComponent(token)}`;
  const mobilePreviewUrl = `${previewUrl}&viewport=mobile`;
  return NextResponse.json({
    token,
    previewUrl,
    desktopPreviewUrl: previewUrl,
    mobilePreviewUrl,
    expiresIn: ttl,
  });
}
