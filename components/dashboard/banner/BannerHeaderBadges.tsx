import React from 'react';
import type { UseBannerExperienceReturn } from './useBannerExperience';

type Props = Pick<UseBannerExperienceReturn, 'bannerCoach' | 'bannerInsights' | 'formatRelativeTime'>;

export function BannerHeaderBadges({ bannerCoach, bannerInsights, formatRelativeTime }: Props) {
  const coachScore = bannerCoach?.score ?? null;
  const lastClick = bannerInsights?.lastClickAt ?? null;
  const totalClicks = bannerInsights?.totalClicks ?? null;

  const lastClickLabel = lastClick ? formatRelativeTime(lastClick) : 'Jamais';

  return (
    <>
      {coachScore !== null ? (
        <span
          className="inline-flex h-6 items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 text-[11px] font-medium text-purple-700"
          title="Score coach bandeau"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-600" aria-hidden />
          Coach {coachScore}%
        </span>
      ) : null}
      <span
        className="inline-flex h-6 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700"
        title={lastClick ? `Dernier clic : ${lastClickLabel}` : 'Aucun clic enregistré'}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
        CTA {totalClicks ?? 0}
        {lastClick ? (
          <span className="hidden xl:inline text-[10px] text-emerald-600/80">• {lastClickLabel}</span>
        ) : null}
      </span>
    </>
  );
}
