import React from 'react';
import type { UseBannerExperienceReturn } from './useBannerExperience';

type Props = Pick<
  UseBannerExperienceReturn,
  'bannerCoach' | 'bannerInsights' | 'bannerInsightsLoading' | 'refreshBannerInsights' | 'formatRelativeTime'
>;

export function BannerGuidesPanel({
  bannerCoach,
  bannerInsights,
  bannerInsightsLoading,
  refreshBannerInsights,
  formatRelativeTime,
}: Props) {
  const checklist = bannerCoach?.checklist ?? [];
  const coachScore = bannerCoach?.score ?? 0;
  const wordCount = bannerCoach?.wordCount ?? null;

  return (
    <>
      <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">Coach bandeau</span>
          <span className="text-xs font-semibold text-purple-700">{coachScore}%</span>
        </div>
        <p className="mt-1 text-xs text-purple-700/80">
          Texte actuel&nbsp;: {wordCount != null ? `${wordCount} mot${wordCount > 1 ? 's' : ''}` : '—'}
        </p>
        <ul className="mt-2 space-y-1.5">
          {checklist.map(item => {
            const statusLabel = item.ok ? 'Validé' : 'À optimiser';
            const statusBadgeClass = item.ok ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700';
            return (
              <li
                key={item.key}
                className={`flex items-start justify-between gap-2 rounded-md border px-2 py-1.5 text-xs ${
                  item.ok ? 'border-transparent text-purple-700/90' : 'border-purple-200 bg-white/85 text-purple-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: item.ok ? '#7c3aed' : '#f97316' }}
                  />
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {item.label}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {!item.ok && item.hint ? (
                      <p className="mt-0.5 text-xs text-purple-600/80">{item.hint}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {checklist.length === 0 && (
          <p className="text-xs text-purple-700/80">Ajoutez vos premiers blocs pour activer les recommandations.</p>
        )}
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Statistiques CTA (30&nbsp;j)</span>
          <button
            type="button"
            onClick={refreshBannerInsights}
            disabled={bannerInsightsLoading}
            className={`inline-flex items-center rounded-full border border-emerald-300 px-2.5 py-1 text-xs font-medium transition ${
              bannerInsightsLoading
                ? 'cursor-not-allowed bg-emerald-200/60 text-emerald-600'
                : 'bg-white text-emerald-700 hover:border-emerald-400 hover:text-emerald-900'
            }`}
          >
            {bannerInsightsLoading ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs text-emerald-700">
          <div className="rounded-md border border-emerald-200 bg-white/85 px-2 py-1.5">
            <div className="text-sm font-semibold text-emerald-800">{bannerInsights?.totalClicks ?? 0}</div>
            <div className="text-xs text-emerald-600">Total</div>
          </div>
          <div className="rounded-md border border-emerald-200 bg-white/85 px-2 py-1.5">
            <div className="text-sm font-semibold text-emerald-800">{bannerInsights?.lastSevenDays ?? 0}</div>
            <div className="text-xs text-emerald-600">7 derniers jours</div>
          </div>
          <div className="rounded-md border border-emerald-200 bg-white/85 px-2 py-1.5">
            <div className="text-sm font-semibold text-emerald-800">
              {bannerInsights?.lastClickAt ? formatRelativeTime(bannerInsights.lastClickAt) : 'Jamais'}
            </div>
            <div className="text-xs text-emerald-600">Dernier clic</div>
          </div>
        </div>
        {bannerInsights?.topCtas?.length ? (
          <ul className="mt-3 space-y-1.5">
            {bannerInsights.topCtas.slice(0, 3).map(cta => {
              const placementLabel = cta.placement ? cta.placement.replace(/[-_]/g, ' ') : 'home';
              return (
                <li
                  key={cta.ctaKey}
                  className="rounded-md border border-emerald-200 bg-white/85 px-2 py-1.5 text-xs text-emerald-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{cta.ctaLabel || cta.ctaHref}</span>
                    <span className="text-xs font-semibold text-emerald-700">{cta.clicks}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-emerald-600">
                    <span>{placementLabel}</span>
                    {cta.presetId && <span>Preset&nbsp;: {cta.presetId}</span>}
                    <span>{cta.lastClickAt ? formatRelativeTime(cta.lastClickAt) : 'Jamais'}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-emerald-700/80">
            Les clics apparaîtront après la publication et les premières visites.
          </p>
        )}
      </div>
    </>
  );
}
