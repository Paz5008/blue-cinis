import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminSession } from '@/lib/adminGuard';
import { recordAdminAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { revalidateArtistCaches } from '@/lib/cacheTags';

// GET: liste des artistes (admin only)
export async function GET(request: NextRequest) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const artists = await prisma.artist.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, isActive: true, isFeatured: true },
  });
  await recordAdminAuditLog({
    action: 'artists.list',
    resource: `artists?count=${artists.length}`,
    session,
    request,
    metadata: { count: artists.length },
  });
  return NextResponse.json(artists, { status: 200 });
}

const createArtistSchema = z.object({
  name: z.string().trim().min(2).max(255),
  biography: z.string().trim().max(4000).optional(),
  artStyle: z.string().trim().max(255).optional(),
  photoUrl: z.string().trim().max(2048).optional(),
  instagramUrl: z.string().trim().max(2048).optional(),
  facebookUrl: z.string().trim().max(2048).optional(),
  contactEmail: z.string().trim().email().max(320).optional(),
  portfolio: z.string().trim().max(2048).optional(),
  phone: z.string().trim().max(80).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const payload = await request.json().catch(() => null);
  const parsed = createArtistSchema.safeParse(payload);
  if (!parsed.success) {
    await recordAdminAuditLog({
      action: 'artists.create',
      resource: 'artist',
      session,
      request,
      status: 'denied',
      metadata: { reason: 'invalid_payload' },
    });
    return NextResponse.json({ error: 'Champs invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const created = await prisma.artist.create({
      data: {
        name: data.name,
        biography: data.biography,
        artStyle: data.artStyle,
        photoUrl: data.photoUrl,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        contactEmail: data.contactEmail,
        portfolio: data.portfolio,
        phone: data.phone,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
      },
      select: { id: true, name: true, isActive: true, isFeatured: true },
    });
    await revalidateArtistCaches((tag) => revalidateTag(tag));
    await recordAdminAuditLog({
      action: 'artists.create',
      resource: created.id,
      session,
      request,
      metadata: { name: created.name },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/admin/artists', error);
    await recordAdminAuditLog({
      action: 'artists.create',
      resource: 'artist',
      session,
      request,
      status: 'error',
    });
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
