import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ConnectStripeCta from "@/components/features/commerce/ConnectStripeCta";
import StripeLoginButton from '@/components/features/auth/StripeLoginButton';
import StripeStatusPanel from "@/components/features/commerce/StripeStatusPanel";
import PaypalStatusPanel from "@/components/features/commerce/PaypalStatusPanel";
import SocialLinksInlineCard from '@/components/dashboard/SocialLinksInlineCard';
import CommerceSettingsForm from '@/components/dashboard/CommerceSettingsForm';
import ShippingSettingsForm from '@/components/dashboard/ShippingSettingsForm';
import NotificationsSettingsCard from '@/components/dashboard/NotificationsSettingsCard';
import StripeTestPaymentButton from '@/components/dashboard/StripeTestPaymentButton';
import CopyLinkButton from '@/components/ui/CopyLinkButton';
import ArtistPublicProfile from '@/components/artist/ArtistPublicProfile';
import { prisma } from '@/lib/prisma';
import { Bell, CreditCard, Globe, LifeBuoy, Share2, Store, Truck } from 'lucide-react';
import SettingsChecklistCard from '@/components/dashboard/SettingsChecklistCard';

async function getArtist(userId: string) {
  try {
    return await prisma.artist.findUnique({
      where: { userId },
      select: {
        id: true,
        slug: true,
        name: true,
        photoUrl: true,
        biography: true,
        artStyle: true,
        enableCommerce: true,
        enableLeads: true,
        deliveryBannerMessage: true,
        artworks: {
          select: { id: true, status: true },
          take: 12,
        },
      },
    });
  } catch (error) {
    console.error('[artist.settings] fallback artist fetch', error);
    const fallback = await prisma.artist.findUnique({
      where: { userId },
      select: {
        id: true,
        slug: true,
        name: true,
        photoUrl: true,
        biography: true,
        artStyle: true,
        artworks: { select: { id: true, status: true }, take: 12 },

      },
    });
    if (!fallback) {
      return null;
    }
    return { ...fallback, enableCommerce: null, enableLeads: null } as any;
  }
}

async function getChecklist(userId: string) {
  try {
    const artist = await prisma.artist.findUnique({
      where: { userId },
      select: {
        id: true,
        slug: true,
        enableCommerce: true,
        name: true,
        photoUrl: true,
        stripeAccountId: true,
        contactEmail: true,
        processingTimeDays: true,
        defaultShippingFee: true,
        portfolio: true,
        instagramUrl: true,
        facebookUrl: true,
        notificationPreferences: true,
      },
    }) as any;
    if (!artist) return null;
    const artworksCount = await prisma.artwork.count({ where: { artistId: artist.id, status: 'available' } });
    const notifications = (() => {
      const prefs = artist.notificationPreferences as any;
      if (!prefs) return true;
      try {
        const sales = prefs.sales || {};
        const leads = prefs.leads || {};
        return !!(sales.email || sales.sms || leads.email || leads.sms);
      } catch {
        return true;
      }
    })();

    return {
      publicUrl: `/artistes/${artist.slug || artist.id}`,
      stripeConnected: !!artist.stripeAccountId,
      commerceEnabled: artist.enableCommerce !== false,
      hasArtwork: artworksCount > 0,
      profileComplete: !!artist.name && !!artist.photoUrl,
      contactEmailSet: !!artist.contactEmail,
      shippingSet: artist.processingTimeDays != null && artist.defaultShippingFee != null,
      socialsSet: !!artist.portfolio || !!artist.instagramUrl || !!artist.facebookUrl,
      notificationsConfigured: notifications,
    };
  } catch (error) {
    console.error('[artist.settings] checklist degraded', error);
    const artist = await prisma.artist.findUnique({
      where: { userId },
      select: {
        id: true,
        slug: true,
        enableCommerce: true,
        name: true,
        photoUrl: true,
        stripeAccountId: true,
        contactEmail: true,
        processingTimeDays: true,
        defaultShippingFee: true,
        portfolio: true,
      },
    });
    if (!artist) return null;
    const artworksCount = await prisma.artwork.count({ where: { artistId: artist.id, status: 'available' } });
    return {
      publicUrl: `/artistes/${(artist as any).slug || (artist as any).id}`,
      stripeConnected: !!(artist as any).stripeAccountId,
      commerceEnabled: (artist as any).enableCommerce !== false,
      hasArtwork: artworksCount > 0,
      profileComplete: !!(artist as any).name && !!(artist as any).photoUrl,
      contactEmailSet: !!(artist as any).contactEmail,
      shippingSet: (artist as any).processingTimeDays != null && (artist as any).defaultShippingFee != null,
      socialsSet: !!(artist as any).portfolio,
      notificationsConfigured: true,
      schemaDegraded: true,
    };
  }
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session || (session.user as any).role !== 'artist') {
    redirect('/');
  }
  const artist = await getArtist(session.user.id);
  const checklist = await getChecklist(session.user.id);
  const featureStateUnknown = artist?.enableCommerce == null || artist?.enableLeads == null;
  const totalSteps = 8;
  const completed = checklist
    ? [
      checklist.stripeConnected,
      checklist.commerceEnabled,
      checklist.hasArtwork,
      checklist.profileComplete,
      checklist.contactEmailSet,
      checklist.shippingSet,
      checklist.socialsSet,
      checklist.notificationsConfigured,
    ].filter(Boolean).length
    : 0;
  const progress = Math.round((completed / totalSteps) * 100);

  const navItems = [
    { id: 'paiements', label: 'Paiements', icon: CreditCard, completed: !!checklist?.stripeConnected },
    { id: 'boutique', label: 'Boutique', icon: Store, completed: !!checklist?.commerceEnabled },
    { id: 'shipping', label: 'Contact & expédition', icon: Truck, completed: !!checklist?.shippingSet && !!checklist?.contactEmailSet },
    { id: 'notifications', label: 'Notifications', icon: Bell, completed: !!checklist?.notificationsConfigured },
    { id: 'reseaux', label: 'Réseaux & visibilité', icon: Share2, completed: !!checklist?.socialsSet },
    { id: 'page-publique', label: 'Page publique', icon: Globe, completed: !!checklist?.profileComplete && !!checklist?.hasArtwork },
    { id: 'support', label: 'Support', icon: LifeBuoy, completed: true },
  ];

  const checklistItems = checklist
    ? [
      {
        id: 'stripe',
        label: 'Connecter Stripe',
        description: 'Activez le paiement sécurisé pour encaisser vos ventes sans friction.',
        completed: checklist.stripeConnected,
        targetId: 'paiements',
        actionLabel: 'Marquer comme fait',
      },
      {
        id: 'commerce',
        label: 'Activer la boutique',
        description: 'Choisissez entre ventes directes et demandes de contact selon votre stratégie.',
        completed: checklist.commerceEnabled,
        targetId: 'boutique',
        actionLabel: 'Configurer',
      },
      {
        id: 'artwork',
        label: 'Publier une œuvre',
        description: 'Ajoutez au moins une œuvre disponible pour rendre la boutique accessible.',
        completed: checklist.hasArtwork,
        targetId: 'page-publique',
        actionLabel: 'Ajouter',
      },
      {
        id: 'profile',
        label: 'Compléter le profil public',
        description: 'Photo, nom et bio renforcent la confiance de vos acheteurs.',
        completed: checklist.profileComplete,
        targetId: 'page-publique',
      },
      {
        id: 'contactEmail',
        label: 'Renseigner un email de contact',
        description: 'Recevez les confirmations d’achat et questions clients au bon endroit.',
        completed: checklist.contactEmailSet,
        targetId: 'shipping',
        actionLabel: 'Compléter',
      },
      {
        id: 'shipping',
        label: 'Définir vos délais et frais d’expédition',
        description: 'Des règles claires réduisent les demandes SAV et rassurent les acheteurs.',
        completed: checklist.shippingSet,
        targetId: 'shipping',
      },
      {
        id: 'socials',
        label: 'Ajouter vos réseaux ou portfolio',
        description: 'Partagez votre univers pour augmenter la conversion sur votre page publique.',
        completed: checklist.socialsSet,
        targetId: 'reseaux',
        actionLabel: 'Ajouter',
      },
      {
        id: 'notifications',
        label: 'Personnaliser les notifications',
        description: 'Choisissez vos alertes email/SMS pour être averti sans attendre.',
        completed: checklist.notificationsConfigured,
        targetId: 'notifications',
        actionLabel: 'Configurer',
      },
    ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-2 lg:px-0 animate-in fade-in duration-500">
      <h1 className="text-3xl font-serif text-white">Paramètres</h1>
      <p className="mt-2 text-sm text-white/60">
        Configurez votre boutique, vos paiements et votre visibilité en un seul endroit.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24">
          <nav className="flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-2 text-sm backdrop-blur-sm lg:flex-col lg:overflow-visible">
            {navItems.map(({ id, label, icon: Icon, completed }) => (
              <a
                key={id}
                href={`#${id}`}
                className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all hover:bg-white/10 focus:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                <span className="flex items-center gap-2 text-white/70 group-hover:text-white">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${completed
                    ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'bg-white/10 text-white/40 ring-1 ring-white/10'
                    }`}
                  aria-hidden="true"
                >
                  {completed ? 'OK' : '•'}
                </span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-8">
          {checklist && (
            <SettingsChecklistCard
              items={checklistItems}
              progress={progress}
              completedCount={completed}
              totalCount={totalSteps}
            />
          )}

          <section
            id="paiements"
            data-settings-section="paiements"
            className="scroll-mt-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition data-[flash=true]:ring-2 data-[flash=true]:ring-white/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif text-white">Paiements</h2>
                <p className="text-sm text-white/60">
                  Connectez Stripe pour activer les encaissements et testez votre parcours d’achat.
                </p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${checklist?.stripeConnected
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-200 ring-amber-500/20'
                  }`}
              >
                {checklist?.stripeConnected ? 'Prêt à encaisser' : 'Action requise'}
              </span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <StripeStatusPanel />
              <PaypalStatusPanel />
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <ConnectStripeCta />
              <div className="flex min-w-[220px] flex-1 flex-col gap-3">
                <StripeLoginButton />
                <Link
                  href="/dashboard-artist/artworks/add"
                  className="text-xs font-medium text-white/60 hover:text-white transition-colors"
                >
                  Besoin d’un produit test ? Publiez rapidement une œuvre éphémère.
                </Link>
              </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-6">
              <StripeTestPaymentButton />
              <p className="mt-2 text-xs text-white/40">
                Lance une session Stripe en mode test avec vos paramètres actuels.
              </p>
            </div>
          </section>

          <section
            id="boutique"
            data-settings-section="boutique"
            className="scroll-mt-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition data-[flash=true]:ring-2 data-[flash=true]:ring-white/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif text-white">Boutique</h2>
                <p className="text-sm text-white/60">
                  Activez les ventes directes et les leads pour piloter votre présence commerciale.
                </p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${checklist?.commerceEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-200 ring-amber-500/20'
                  }`}
              >
                {checklist?.commerceEnabled ? 'Visibles à la vente' : 'Boutique désactivée'}
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {featureStateUnknown && (
                <div className="rounded border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  L’état actuel de votre boutique est momentanément inconnu. Contactez le support si les commutateurs restent
                  indisponibles après rechargement.
                </div>
              )}
              <CommerceSettingsForm
                initialEnableCommerce={typeof artist?.enableCommerce === 'boolean' ? artist.enableCommerce : null}
                initialEnableLeads={typeof artist?.enableLeads === 'boolean' ? artist.enableLeads : null}
                settingsUnavailable={featureStateUnknown}
              />
            </div>
          </section>

          <section
            id="shipping"
            data-settings-section="shipping"
            className="scroll-mt-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition data-[flash=true]:ring-2 data-[flash=true]:ring-white/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif text-white">Contact & expédition</h2>
                <p className="text-sm text-white/60">
                  Harmonisez vos informations de contact et vos promesses logistiques.
                </p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${checklist?.shippingSet && checklist?.contactEmailSet
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-200 ring-amber-500/20'
                  }`}
              >
                {checklist?.shippingSet && checklist?.contactEmailSet ? 'À jour' : 'Informations manquantes'}
              </span>
            </div>
            {!checklist?.shippingSet && (
              <div className="mt-4 rounded border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                Précisez vos délais et frais d’expédition : ces informations apparaissent dans la checklist et rassurent vos acheteurs avant paiement.
              </div>
            )}
            <div className="mt-6">
              <ShippingSettingsForm />
            </div>
          </section>

          <section
            id="notifications"
            data-settings-section="notifications"
            className="scroll-mt-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition data-[flash=true]:ring-2 data-[flash=true]:ring-white/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif text-white">Notifications</h2>
                <p className="text-sm text-white/60">
                  Choisissez les alertes à recevoir lorsqu’une vente ou un lead arrive.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                Personnalisé
              </span>
            </div>
            <div className="mt-6">
              <NotificationsSettingsCard />
            </div>
          </section>

          <section
            id="reseaux"
            data-settings-section="reseaux"
            className="scroll-mt-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition data-[flash=true]:ring-2 data-[flash=true]:ring-white/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif text-white">Réseaux & visibilité</h2>
                <p className="text-sm text-white/60">
                  Centralisez vos liens et mettez-les à jour sans quitter la page.
                </p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${checklist?.socialsSet
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-200 ring-amber-500/20'
                  }`}
              >
                {checklist?.socialsSet ? 'Liens renseignés' : 'Compléter vos liens'}
              </span>
            </div>
            <div className="mt-6">
              <SocialLinksInlineCard />
            </div>
          </section>

          <section
            id="page-publique"
            data-settings-section="page-publique"
            className="scroll-mt-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition data-[flash=true]:ring-2 data-[flash=true]:ring-white/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif text-white">Page publique</h2>
                <p className="text-sm text-white/60">
                  Visualisez vos informations publiques et partagez votre profil en un clic.
                </p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${checklist?.profileComplete
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-200 ring-amber-500/20'
                  }`}
              >
                {checklist?.profileComplete ? 'Profil complet' : 'Compléter le profil'}
              </span>
            </div>
            <div className="mt-6 grid gap-4">
              {artist && (
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <ArtistPublicProfile artist={{ ...(artist as any), artworks: ((artist as any).artworks || []).map((a: any) => ({ ...a, status: a.status })) }} />
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/artistes/${artist?.slug || artist?.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  Consulter la page publique
                </Link>
                {artist && (
                  <CopyLinkButton
                    url={`/artistes/${artist.slug || artist.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  />
                )}
                <Link
                  href="/dashboard-artist/customization/profile"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition-colors"
                >
                  Personnaliser le profil
                </Link>
              </div>
            </div>
          </section>

          <section
            id="support"
            data-settings-section="support"
            className="scroll-mt-24 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition data-[flash=true]:ring-2 data-[flash=true]:ring-white/20"
          >
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-white" aria-hidden="true" />
              <h2 className="text-lg font-serif text-white">Besoin d’aide ?</h2>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Retrouvez les ressources essentielles pour finaliser votre onboarding.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <h3 className="text-sm font-semibold text-white">Docs & tutoriels</h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/docs/onboarding" className="text-white/60 hover:text-white hover:underline decoration-white/30 transition-colors">
                      Guide d’onboarding
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/stripe" className="text-white/60 hover:text-white hover:underline decoration-white/30 transition-colors">
                      Configuration Stripe
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/expedition" className="text-white/60 hover:text-white hover:underline decoration-white/30 transition-colors">
                      Expédition & logistique
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <h3 className="text-sm font-semibold text-white">Support direct</h3>
                <p className="mt-2 text-white/60">
                  Une question sur un paiement ou une commande ? Contactez-nous.
                </p>
                <div className="mt-3 space-y-2">
                  <Link href="mailto:support@loire.gallery" className="block text-white/60 hover:text-white hover:underline decoration-white/30 transition-colors">
                    support@loire.gallery
                  </Link>
                  <Link href="/docs/faq" className="block text-white/60 hover:text-white hover:underline decoration-white/30 transition-colors">
                    FAQ artistes
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
