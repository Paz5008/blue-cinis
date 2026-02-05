import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminSession } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';
import { recordAdminAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cacheTags';

const eventSelect = { id: true, title: true, description: true, date: true, location: true, imageUrl: true } as const;

const createEventSchema = z.object({
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(2000).optional(),
  date: z.coerce.date(),
  location: z.string().trim().max(255).optional(),
  imageUrl: z.string().trim().max(2048).optional(),
});

async function revalidateEventsCaches() {
  await Promise.all([revalidateTag(CACHE_TAGS.upcomingEvents), revalidatePath('/evenements')]);
}

export async function GET(request: NextRequest) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' },
    select: eventSelect,
  });
  await recordAdminAuditLog({
    action: 'events.list',
    resource: `events?count=${events.length}`,
    session,
    request,
    metadata: { count: events.length },
  });
  return NextResponse.json(events, { status: 200 });
}

export async function POST(request: NextRequest) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    await recordAdminAuditLog({
      action: 'events.create',
      resource: 'event',
      session,
      request,
      status: 'denied',
      metadata: { reason: 'invalid_payload' },
    });
    return NextResponse.json({ error: 'Champs invalides', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const created = await prisma.event.create({
      data: parsed.data,
      select: eventSelect,
    });
    await revalidateEventsCaches();
    await recordAdminAuditLog({
      action: 'events.create',
      resource: created.id,
      session,
      request,
      metadata: { date: created.date },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/admin/events', error);
    await recordAdminAuditLog({
      action: 'events.create',
      resource: 'event',
      session,
      request,
      status: 'error',
    });
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
