import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserAlerts } from '@/src/actions/alerts';
import AlertsClient from './AlertsClient';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
    const session = await auth();

    if (!session || (session.user as any).role !== 'artist') {
        redirect('/auth/signin');
    }

    // Fetch alerts
    const alertsResult = await getUserAlerts();
    const alerts = alertsResult.success ? alertsResult.data : [];

    // Fetch artists for filter (all active artists)
    const artists = await prisma.artist.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });

    // Fetch categories for filter
    const categories = await prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <AlertsClient
                initialAlerts={alerts}
                artists={artists}
                categories={categories}
            />
        </div>
    );
}
