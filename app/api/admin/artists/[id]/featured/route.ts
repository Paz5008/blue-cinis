import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminSession } from '@/lib/adminGuard';
import { z } from 'zod';
import { recordAdminAuditLog } from '@/lib/audit';
import { revalidateTag } from 'next/cache';
import { revalidateArtistCaches } from '@/lib/cacheTags';

const featuredSchema = z.object({
  isFeatured: z.boolean(),
});

// PUT: Toggle/set isFeatured for an artist (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = featuredSchema.safeParse(json);
    if (!parsed.success) {
      await recordAdminAuditLog({
        action: 'artists.updateFeatured',
        resource: params.id,
        session,
        request,
        status: 'denied',
        metadata: { reason: 'invalid_payload' },
      });
      return NextResponse.json({ error: 'Payload invalide: isFeatured booléen requis' }, { status: 400 });
    }
    const updated = await prisma.artist.update({
      where: { id: params.id },
      data: { isFeatured: parsed.data.isFeatured },
      select: { id: true, isFeatured: true },
    });
    await revalidateArtistCaches((tag) => revalidateTag(tag));
    await recordAdminAuditLog({
      action: 'artists.updateFeatured',
      resource: params.id,
      session,
      request,
      metadata: { isFeatured: parsed.data.isFeatured },
    });
    const isFeatured = typeof updated.isFeatured === 'boolean' ? updated.isFeatured : parsed.data.isFeatured;
    return NextResponse.json({ id: updated.id, isFeatured }, { status: 200 });
  } catch (e) {
    console.error('Erreur PUT /api/admin/artists/[id]/featured', e);
    await recordAdminAuditLog({
      action: 'artists.updateFeatured',
      resource: params.id,
      session,
      request,
      status: 'error',
    });
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
