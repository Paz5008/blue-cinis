import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { ensureAdminSession } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';
import { recordAdminAuditLog } from '@/lib/audit';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cacheTags';

async function revalidateEventsCaches() {
  await Promise.all([revalidateTag(CACHE_TAGS.upcomingEvents), revalidatePath('/evenements')]);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const eventId = params.id;
  try {
    const existing = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, title: true } });
    if (!existing) {
      await recordAdminAuditLog({
        action: 'events.delete',
        resource: eventId,
        session,
        request,
        status: 'denied',
        metadata: { reason: 'not_found' },
      });
      return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 });
    }
    await prisma.event.delete({ where: { id: eventId } });
    await revalidateEventsCaches();
    await recordAdminAuditLog({
      action: 'events.delete',
      resource: eventId,
      session,
      request,
      metadata: { title: existing.title },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Erreur DELETE /api/admin/events/[id]', error);
    await recordAdminAuditLog({
      action: 'events.delete',
      resource: eventId,
      session,
      request,
      status: 'error',
    });
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
