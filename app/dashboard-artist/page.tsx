import Link from "next/link";
export const dynamic = 'force-dynamic';
// app/dashboard-artist/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ArtistPublicProfile from "@/components/artist/ArtistPublicProfile";

type DashboardAction = {
  title: string;
  description: string;
  href: string;
};

function formatCurrency(amountCents: number, currency?: string) {
  const iso = (currency || "EUR").toUpperCase();
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: iso,
    maximumFractionDigits: 2,
  }).format((amountCents || 0) / 100);
}

export default async function DashboardArtistPage() {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== 'artist') {
    redirect('/auth/signin');
  }

  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      slug: true,
      isActive: true,
      isFeatured: true,
      name: true,
      biography: true,
      photoUrl: true,
      phone: true,
      portfolio: true,
      artStyle: true,
      enableCommerce: true,
      stripeAccountId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      artworks: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          price: true,
          createdAt: true,
          updatedAt: true,
          artistId: true,
          artistName: true,
          dimensions: true,
          year: true,
          categoryId: true,
          description: true,
          status: true,
        },
      },
    },
  });

  if (!artist) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-4">Bienvenue sur votre dashboard</h1>
        <p className="mb-4">Vous n'avez pas encore créé votre profil artiste.</p>
        <p>
          Pour commencer,{' '}
          <Link href="/dashboard-artist/customization" className="text-accent hover:underline">
            personnalisez votre profil
          </Link>.
        </p>
      </div>
    );
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Use Prisma aggregate for performance (DB-side calculation instead of JS)
  const [orderAggregates, pendingShipments, leadsTotal, recentLeads] = await Promise.all([
    prisma.order.aggregate({
      where: { artistId: artist.id, createdAt: { gte: ninetyDaysAgo }, status: 'paid' },
      _sum: { amount: true, net: true },
      _count: { id: true },
    }),
    prisma.order.count({
      where: {
        artistId: artist.id,
        status: 'paid',
        fulfillmentStatus: 'pending_shipment',
      },
    }),
    prisma.lead.count({ where: { artistId: artist.id } }),
    prisma.lead.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        artworkId: true,
        message: true,
      },
    }),
  ]);

  // DB-aggregated values (no more JS .reduce on potentially thousands of orders)
  const grossVolume = orderAggregates._sum.amount || 0;
  const netVolume = orderAggregates._sum.net || 0;
  const paidOrdersCount = orderAggregates._count.id;
  const totalAvailableArtworks = (artist.artworks || []).filter((artwork) => artwork.status === 'available').length;

  const actionItems: DashboardAction[] = [];
  if (!artist.stripeAccountId) {
    actionItems.push({
      title: "Connecter Stripe Connect",
      description: "Activez les paiements et transferts en finalisant votre onboarding Stripe.",
      href: "/dashboard-artist/parametres?tab=payouts",
    });
  }
  if ((artist.artworks || []).length === 0) {
    actionItems.push({
      title: "Ajouter votre première œuvre",
      description: "Publiez une œuvre pour la rendre visible et commencer à vendre.",
      href: "/dashboard-artist/artworks/add",
    });
  }
  if (!artist.biography || artist.biography.trim().length < 20) {
    actionItems.push({
      title: "Compléter votre biographie",
      description: "Présentez-vous pour renforcer la confiance des collectionneurs.",
      href: "/dashboard-artist/profile",
    });
  }
  if (artist.enableCommerce === false) {
    actionItems.push({
      title: "Activer la vente en ligne",
      description: "Autorisez la boutique à encaisser des paiements Stripe ou PayPal.",
      href: "/dashboard-artist/profile",
    });
  }
  if (pendingShipments > 0) {
    actionItems.push({
      title: "Expédier vos commandes en attente",
      description: "Marquez les commandes comme expédiées pour rassurer vos acheteurs.",
      href: "/dashboard-artist/orders",
    });
  }

  const metrics = [
    { label: "Ventes (90 jours)", value: formatCurrency(grossVolume, 'EUR') },
    { label: "Revenus nets estimés", value: formatCurrency(netVolume, 'EUR') },
    { label: "Commandes payées", value: String(paidOrdersCount) },
    { label: "Commandes à expédier", value: String(pendingShipments) },
    { label: "Leads cumulés", value: String(leadsTotal) },
    { label: "Œuvres disponibles", value: String(totalAvailableArtworks) },
  ];

  const quickActions = [
    { href: "/dashboard-artist/artworks/add", label: "Ajouter une œuvre" },
    { href: "/dashboard-artist/leads", label: "Voir mes demandes" },
    { href: "/dashboard-artist/orders", label: "Suivre mes commandes" },
    { href: "/dashboard-artist/customization", label: "Personnaliser ma page" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif text-white">Bonjour, {artist.name || "Artiste"}.</h1>
          <p className="text-white/60 font-light">
            Voici un aperçu de votre activité et de vos performances.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/" target="_blank" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors text-white">
            Voir le site
          </Link>
        </div>
      </header>

      {/* ACTION ITEMS */}
      {actionItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4 text-white/40 uppercase tracking-widest text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Priorités
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actionItems.map((item) => (
              <Link key={item.href} href={item.href} className="group block p-6 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-white/20 transition-all duration-300">
                <h3 className="font-medium text-white mb-2 group-hover:text-amber-200 transition-colors">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-white/40 group-hover:text-white transition-colors">
                  Agir maintenant →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* METRICS */}
      <section>
        <h2 className="text-2xl font-serif text-white mb-6">Indicateurs clés</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:bg-white/10 transition-colors">
              <p className="text-xs uppercase tracking-widest text-white/40 font-medium z-10 relative">{metric.label}</p>
              <p className="mt-2 text-3xl font-serif text-white z-10 relative">{metric.value}</p>
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-16 h-16 bg-white/5 rounded-full blur-2xl -mt-8 -mr-8 pointer-events-none"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT LEADS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-serif text-white">Dernières demandes</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-sm">
          {recentLeads.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              <p>Aucune demande pour le moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-white">{lead.name}</span>
                    <span className="text-xs text-white/30">{formatDistanceToNow(lead.createdAt, { addSuffix: true, locale: fr })}</span>
                  </div>
                  <div className="text-sm text-white/60 mb-2">{lead.email}</div>

                  {lead.artworkId && (
                    <div className="inline-flex items-center gap-2 text-xs py-1 px-2 rounded bg-white/5 border border-white/5 text-white/70">
                      Œuvre : {lead.artworkId}
                    </div>
                  )}
                  {lead.message && (
                    <p className="mt-3 text-sm text-white/50 line-clamp-2 pl-3 border-l-2 border-white/10 italic">
                      "{lead.message}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <Link href="/dashboard-artist/leads" className="text-sm font-medium text-white/60 hover:text-white transition-colors flex items-center justify-center gap-2">
              Voir toutes les demandes
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS & PROFILE */}
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-serif text-white mb-6">Votre profil public</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <ArtistPublicProfile
              artist={{
                ...artist,
                slug: artist.slug ?? undefined,
                artworks: (artist.artworks || []).map(a => ({ ...a, status: a.status })),
              }}
            />
            <Link
              href="/dashboard-artist/customization"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white text-black px-4 py-3 text-sm font-medium transition-all hover:bg-white/90"
            >
              Personnaliser ma page
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
