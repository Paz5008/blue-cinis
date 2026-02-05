import React from 'react';
import { BannerGuidesPanel } from './BannerGuidesPanel';
import type { UseBannerExperienceReturn } from './useBannerExperience';

type Props = Pick<
  UseBannerExperienceReturn,
  'bannerCoach' | 'bannerInsights' | 'bannerInsightsLoading' | 'refreshBannerInsights' | 'formatRelativeTime' | 'bannerCanvasDiagnostics'
>;

export function BannerOptimizePanel({
  bannerCoach,
  bannerInsights,
  bannerInsightsLoading,
  refreshBannerInsights,
  formatRelativeTime,
  bannerCanvasDiagnostics,
}: Props) {
  const overflow = bannerCanvasDiagnostics?.overflow ?? 0;
  const slack = bannerCanvasDiagnostics?.slack ?? 0;
  const checklistTotal = bannerCoach?.checklist?.length ?? 0;
  const checklistOk = bannerCoach?.checklist?.filter(item => item.ok).length ?? 0;

  const dimensionMessage = (() => {
    if (!bannerCanvasDiagnostics) {
      return 'Aucun bloc mesuré. Ajoutez du contenu pour calculer la hauteur.';
    }
    if (overflow > 0) {
      return `Réduisez vos espacements ou le nombre de blocs pour revenir sous ${bannerCanvasDiagnostics.limit}px.`;
    }
    if (slack < 24) {
      return 'Votre bandeau est optimal, mais gardez une petite marge pour l’ajustement mobile.';
    }
    return 'Hauteur confortable : vous pouvez ajouter un court texte ou un visuel supplémentaire.';
  })();

  return (
    <aside
      className="order-2 flex w-full flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 xl:order-auto xl:col-start-2 xl:row-start-1 xl:self-start"
      aria-label="Optimisation du bandeau"
    >
      {bannerCoach && (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Score bandeau</span>
            <span className="text-base font-semibold text-blue-600">{Math.round(bannerCoach.score)}%</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {checklistTotal > 0
              ? `${checklistOk}/${checklistTotal} points checklist validés`
              : 'Complétez les étapes pour améliorer votre impact.'}
          </p>
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <span>Hauteur du bandeau</span>
          {bannerCanvasDiagnostics ? <span>{bannerCanvasDiagnostics.ratioLabel}</span> : null}
        </div>
        <p className="mt-1 text-[12px] leading-snug">
          {bannerCanvasDiagnostics
            ? `${bannerCanvasDiagnostics.used}px utilisés sur ${bannerCanvasDiagnostics.limit}px`
            : '—'}
        </p>
        <p className="mt-2 text-[12px] leading-snug text-slate-600/80">{dimensionMessage}</p>
      </div>
      <BannerGuidesPanel
        bannerCoach={bannerCoach}
        bannerInsights={bannerInsights}
        bannerInsightsLoading={bannerInsightsLoading}
        refreshBannerInsights={refreshBannerInsights}
        formatRelativeTime={formatRelativeTime}
      />
    </aside>
  );
}
