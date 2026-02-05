import { auth } from '@/auth';
import type { Session } from 'next-auth';
import type { FulfillmentStatus, OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureArtistProfile } from '@/lib/artist-profile';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

function formatCents(v: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(v / 100);
}

async function markOrderShipped(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session || session.user.role !== 'artist') {
    throw new Error('Unauthorized');
  }
  const orderId = formData.get('orderId');
  if (typeof orderId !== 'string' || !orderId) {
    return;
  }
  const artist = await ensureArtistProfile(session as Session, {
    select: { id: true },
  });
  if (!artist) return;
  const res = await prisma.order.updateMany({
    where: { id: orderId, artistId: artist.id, fulfillmentStatus: { not: 'shipped' } },
    data: { fulfillmentStatus: 'shipped', fulfilledAt: new Date() },
  });
  if (!res.count) return;
  revalidatePath('/dashboard-artist/orders');
  revalidatePath('/dashboard-artist');
}

export default async function ArtistOrdersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'artist') {
    return (
      <section className="p-8"><p>Non autorisé.</p></section>
    );
  }
  const artist = await ensureArtistProfile(session as Session);
  if (!artist) {
    return (
      <section className="p-8"><p>Profil artiste introuvable.</p></section>
    );
  }
  const readParam = (key: string) => {
    const raw = searchParams?.[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const page = Math.max(1, parseInt(readParam('page') || '1', 10) || 1);
  const pageSize = 20;
  const statusFilter = (readParam('status') || '').trim();
  const fulfillmentFilter = (readParam('fulfillment') || '').trim();
  const from = (readParam('from') || '').trim();
  const to = (readParam('to') || '').trim();
  const q = (readParam('q') || '').trim();

  const allowedStatuses: OrderStatus[] = ['paid', 'refunded', 'disputed', 'failed'];
  const allowedFulfillment: FulfillmentStatus[] = ['pending_shipment', 'shipped'];
  const orderStatus = allowedStatuses.find((value) => value === statusFilter);
  const fulfillmentStatus = allowedFulfillment.find((value) => value === fulfillmentFilter);

  const where: Prisma.OrderWhereInput = { artistId: artist.id };
  if (orderStatus) {
    where.status = orderStatus;
  }
  if (fulfillmentStatus) {
    where.fulfillmentStatus = fulfillmentStatus;
  }
  if (from || to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (from) {
      createdAt.gte = new Date(from);
    }
    if (to) {
      createdAt.lte = new Date(to);
    }
    where.createdAt = createdAt;
  }
  if (q) {
    where.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { buyerEmail: { contains: q, mode: 'insensitive' } },
      { buyerName: { contains: q, mode: 'insensitive' } },
      { artworkId: { contains: q, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * pageSize;
  const [total, orders, aggregates] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        artworkId: true,
        buyerEmail: true,
        buyerName: true,
        amount: true,
        currency: true,
        fee: true,
        net: true,
        status: true,
        fulfillmentStatus: true,
        fulfilledAt: true,
        createdAt: true,
      },
    }),
    prisma.order.aggregate({
      where,
      _sum: { amount: true, net: true, fee: true },
    }),
  ]);
  const ids = Array.from(new Set(orders.map((o) => o.artworkId)));
  const artworks = ids.length
    ? await prisma.artwork.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
    : [];
  const artById = new Map(artworks.map((a) => [a.id, a] as const));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const stats = {
    orders: total,
    gross: aggregates._sum.amount || 0,
    net: aggregates._sum.net || 0,
    fee: aggregates._sum.fee || 0,
  };
  const buildPageLink = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (statusFilter) params.set('status', statusFilter);
    if (fulfillmentFilter) params.set('fulfillment', fulfillmentFilter);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', String(targetPage));
    return `/dashboard-artist/orders?${params.toString()}`;
  };
  const hasFilters = Boolean(q || statusFilter || fulfillmentFilter || from || to);

  return (
    <section className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white">Mes commandes</h1>
          <p className="text-white/60 mt-1">Suivez l'état de vos ventes et expéditions.</p>
        </div>
        <a href="/api/artist/orders/export" className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 transition-colors">
          Exporter en CSV
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Commandes" value={stats.orders} />
        <MetricCard label="Montant brut" value={formatCents(stats.gross)} />
        <MetricCard label="Net estimé" value={formatCents(stats.net)} helper={`Frais plateforme ${formatCents(stats.fee)}`} />
      </div>

      <form className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:grid-cols-4" action="/dashboard-artist/orders" method="get">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/40" htmlFor="q">Recherche</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Email, ID, œuvre" className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-white/30 focus:border-white/30 focus:outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/40" htmlFor="status">Statut paiement</label>
          <select id="status" name="status" defaultValue={statusFilter} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-white/30 focus:outline-none">
            <option value="">Tous</option>
            <option value="paid">Payé</option>
            <option value="refunded">Remboursé</option>
            <option value="disputed">Litige</option>
            <option value="failed">Échec</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/40" htmlFor="fulfillment">Livraison</label>
          <select id="fulfillment" name="fulfillment" defaultValue={fulfillmentFilter} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-white/30 focus:outline-none">
            <option value="">Toutes</option>
            <option value="pending_shipment">En préparation</option>
            <option value="shipped">Expédiée</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/40">Intervalle</label>
          <div className="flex gap-2">
            <input name="from" type="date" defaultValue={from} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-white/30 focus:outline-none" />
            <input name="to" type="date" defaultValue={to} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-white/30 focus:outline-none" />
          </div>
        </div>
        <div className="flex items-end gap-3 md:col-span-4 pt-2">
          <button type="submit" className="rounded-lg bg-white text-black font-medium px-6 py-2 hover:bg-white/90 transition-colors">Filtrer</button>
          {hasFilters && (
            <Link href="/dashboard-artist/orders" className="text-sm font-medium text-white/60 underline hover:text-white transition-colors">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {orders.length === 0 ? (
        <div className="p-12 text-center border border-white/10 bg-white/5 rounded-xl">
          <p className="text-white/40">Aucune commande pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-white/5 text-white/40 uppercase tracking-wider text-xs font-medium">
              <tr>
                <th className="py-3 px-4 font-normal">Date</th>
                <th className="py-3 px-4 font-normal">Œuvre</th>
                <th className="py-3 px-4 font-normal">Montant</th>
                <th className="py-3 px-4 font-normal">Commission</th>
                <th className="py-3 px-4 font-normal">Net</th>
                <th className="py-3 px-4 font-normal">Acheteur</th>
                <th className="py-3 px-4 font-normal">Statut</th>
                <th className="py-3 px-4 font-normal">Livraison</th>
                <th className="py-3 px-4 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent text-white/80">
              {orders.map(o => {
                const art = artById.get(o.artworkId);
                const currency = (o.currency || 'eur').toUpperCase();
                const canShip = o.status === 'paid' && o.fulfillmentStatus !== 'shipped';
                const fulfilledAtLabel = o.fulfilledAt
                  ? new Date(o.fulfilledAt).toLocaleDateString('fr-FR')
                  : null;
                return (
                  <tr key={o.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-4 font-medium text-white">{art?.title ?? o.artworkId}</td>
                    <td className="py-3 px-4">{formatCents(o.amount, currency)}</td>
                    <td className="py-3 px-4 text-white/40">{formatCents(o.fee, currency)}</td>
                    <td className="py-3 px-4 font-medium text-emerald-400">{formatCents(o.net, currency)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span>{o.buyerName || 'Anonyme'}</span>
                        <span className="text-xs text-white/40">{o.buyerEmail || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${o.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                          o.status === 'refunded' ? 'bg-red-500/10 text-red-400' :
                            'bg-white/10 text-white/60'
                        }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="capitalize text-xs">{o.fulfillmentStatus ?? 'n/a'}</span>
                        {fulfilledAtLabel && (
                          <span className="text-[10px] text-white/40">Expédiée le {fulfilledAtLabel}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canShip && (
                        <form action={markOrderShipped}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white hover:text-black hover:border-white"
                          >
                            Expédier
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-sm">
        {page > 1 ? (
          <Link href={buildPageLink(page - 1)} className="text-white/60 hover:text-white underline">
            ← Page précédente
          </Link>
        ) : (
          <span className="text-white/20">← Page précédente</span>
        )}
        <span className="text-white/40">
          Page {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={buildPageLink(page + 1)} className="text-white/60 hover:text-white underline">
            Page suivante →
          </Link>
        ) : (
          <span className="text-white/20">Page suivante →</span>
        )}
      </div>
    </section>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-serif text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-white/40">{helper}</p> : null}
    </div>
  );
}
