import { requireAdminSessionOrRedirect } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';
import EventsClient from './_components/EventsClient';

export default async function AdminEventsPage() {
  await requireAdminSessionOrRedirect('/admin/events');

  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' },
    select: { id: true, title: true, description: true, date: true, location: true, imageUrl: true },
  });

  return <EventsClient initialEvents={events} />;
}
