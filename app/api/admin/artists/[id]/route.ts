import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { ensureAdminSession } from '@/lib/adminGuard';
import { z } from 'zod';
import { recordAdminAuditLog } from '@/lib/audit';
import { revalidateTag } from 'next/cache';
import { revalidateArtistCaches } from '@/lib/cacheTags';
import { ADMIN_ARTIST_DETAIL_SELECT } from '@/lib/adminArtists';
import { apiLogger } from '@/lib/logger';

function isPrismaNotFoundError(error: unknown): error is { code: 'P2025' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2025'
  );
}

const toggleSchema = z.object({
  isActive: z.boolean(),
});

const updateArtistSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(255)
      .optional(),
    biography: z
      .union([z.string().trim().max(4000), z.literal(null)])
      .optional(),
    artStyle: z
      .union([z.string().trim().max(255), z.literal(null)])
      .optional(),
    photoUrl: z
      .union([z.string().trim().max(2048), z.literal(null)])
      .optional(),
    contactEmail: z
      .union([z.string().trim().email().max(320), z.literal(null)])
      .optional(),
    phone: z
      .union([z.string().trim().max(80), z.literal(null)])
      .optional(),
    portfolio: z
      .union([z.string().trim().max(2048), z.literal(null)])
      .optional(),
    instagramUrl: z
      .union([z.string().trim().max(2048), z.literal(null)])
      .optional(),
    facebookUrl: z
      .union([z.string().trim().max(2048), z.literal(null)])
      .optional(),
    deliveryBannerMessage: z
      .union([z.string().trim().max(200), z.literal(null)])
      .optional(),
    enableCommerce: z.boolean().optional(),
    enableLeads: z.boolean().optional(),
    allowInternationalShipping: z.boolean().optional(),
    defaultShippingFee: z
      .union([z.number().int().min(0).max(500_000), z.literal(null)])
      .optional(),
    processingTimeDays: z
      .union([z.number().int().min(0).max(60), z.literal(null)])
      .optional(),
  })
  .strict();

const nullableStringFields = [
  'biography',
  'artStyle',
  'photoUrl',
  'contactEmail',
  'phone',
  'portfolio',
  'instagramUrl',
  'facebookUrl',
  'deliveryBannerMessage',
] as const;

function normalizePayload(payload: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...payload };
  if (typeof normalized.name === 'string') {
    normalized.name = normalized.name.trim();
  }
  for (const field of nullableStringFields) {
    if (field in normalized) {
      const value = normalized[field];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        normalized[field] = trimmed.length ? trimmed : null;
      } else if (value === null) {
        normalized[field] = null;
      }
    }
  }
  return normalized;
}

// GET: détails complets d’un artiste (admin)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const artist = await prisma.artist.findUnique({
      where: { id: params.id },
      select: ADMIN_ARTIST_DETAIL_SELECT,
    });
    if (!artist) {
      await recordAdminAuditLog({
        action: 'artists.detail',
        resource: params.id,
        session,
        request,
        status: 'denied',
        metadata: { reason: 'not_found' },
      });
      return NextResponse.json({ error: 'Artiste introuvable' }, { status: 404 });
    }
    await recordAdminAuditLog({
      action: 'artists.detail',
      resource: params.id,
      session,
      request,
    });
    return NextResponse.json(artist, { status: 200 });
  } catch (error) {
    apiLogger.error({ err: error, route: 'GET /api/admin/artists/[id]', artistId: params.id }, 'Error fetching artist');
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// PUT: mise à jour avancée (admin)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }
    const normalized = normalizePayload(payload as Record<string, unknown>);
    const parsed = updateArtistSchema.safeParse(normalized);
    if (!parsed.success) {
      await recordAdminAuditLog({
        action: 'artists.updateDetails',
        resource: params.id,
        session,
        request,
        status: 'denied',
        metadata: { reason: 'invalid_payload', issues: parsed.error.flatten() },
      });
      return NextResponse.json({ error: 'Champs invalides', details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return NextResponse.json({ error: 'Aucun champ fourni' }, { status: 400 });
    }
    const updateData = Object.fromEntries(entries);

    const updated = await prisma.artist.update({
      where: { id: params.id },
      data: updateData,
      select: ADMIN_ARTIST_DETAIL_SELECT,
    });
    await revalidateArtistCaches((tag) => revalidateTag(tag));
    await recordAdminAuditLog({
      action: 'artists.updateDetails',
      resource: params.id,
      session,
      request,
      metadata: { fields: entries.map(([key]) => key) },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      await recordAdminAuditLog({
        action: 'artists.updateDetails',
        resource: params.id,
        session,
        request,
        status: 'denied',
        metadata: { reason: 'not_found' },
      });
      return NextResponse.json({ error: 'Artiste introuvable' }, { status: 404 });
    }
    apiLogger.error({ err: error, route: 'PUT /api/admin/artists/[id]', artistId: params.id }, 'Error updating artist');
    await recordAdminAuditLog({
      action: 'artists.updateDetails',
      resource: params.id,
      session,
      request,
      status: 'error',
    });
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// PATCH: mettre à jour isActive (admin)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = toggleSchema.safeParse(json);
    if (!parsed.success) {
      await recordAdminAuditLog({
        action: 'artists.updateActive',
        resource: params.id,
        session,
        request,
        status: 'denied',
        metadata: { reason: 'invalid_payload' },
      });
      return NextResponse.json({ error: 'Payload invalide: isActive booléen requis' }, { status: 400 });
    }
    const updated = await prisma.artist.update({ where: { id: params.id }, data: { isActive: parsed.data.isActive } });
    await revalidateArtistCaches((tag) => revalidateTag(tag));
    await recordAdminAuditLog({
      action: 'artists.updateActive',
      resource: params.id,
      session,
      request,
      metadata: { isActive: parsed.data.isActive },
    });
    return NextResponse.json({ id: updated.id, isActive: updated.isActive }, { status: 200 });
  } catch (e) {
    apiLogger.error({ err: e, route: 'PATCH /api/admin/artists/[id]', artistId: params.id }, 'Error toggling artist active');
    await recordAdminAuditLog({
      action: 'artists.updateActive',
      resource: params.id,
      session,
      request,
      status: 'error',
    });
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const artistId = params.id;
  try {
    const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { id: true, name: true } });
    if (!artist) {
      await recordAdminAuditLog({
        action: 'artists.delete',
        resource: artistId,
        session,
        request,
        status: 'denied',
        metadata: { reason: 'not_found' },
      });
      return NextResponse.json({ error: 'Artiste introuvable' }, { status: 404 });
    }
    const artworks = await prisma.artwork.count({ where: { artistId } });
    if (artworks > 0) {
      await recordAdminAuditLog({
        action: 'artists.delete',
        resource: artistId,
        session,
        request,
        status: 'denied',
        metadata: { reason: 'has_artworks', artworks },
      });
      return NextResponse.json(
        { error: 'Impossible de supprimer un artiste avec des œuvres. Supprimez ou réassignez les œuvres associées.' },
        { status: 400 },
      );
    }
    await prisma.artist.delete({ where: { id: artistId } });
    await revalidateArtistCaches((tag) => revalidateTag(tag));
    await recordAdminAuditLog({
      action: 'artists.delete',
      resource: artistId,
      session,
      request,
      metadata: { name: artist.name },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    apiLogger.error({ err: error, route: 'DELETE /api/admin/artists/[id]', artistId }, 'Error deleting artist');
    await recordAdminAuditLog({
      action: 'artists.delete',
      resource: artistId,
      session,
      request,
      status: 'error',
    });
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
