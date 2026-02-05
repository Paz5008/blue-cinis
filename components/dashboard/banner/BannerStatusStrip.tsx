import React from 'react';
import type { UseBannerExperienceReturn } from './useBannerExperience';
import { AlertTriangle as AlertTriangleIcon } from 'lucide-react';

type Props = {
  diagnostics: UseBannerExperienceReturn['bannerCanvasDiagnostics'];
};

export function BannerStatusStrip({ diagnostics }: Props) {
  if (!diagnostics) return null;

  const { used, limit, ratioLabel, overflow, slack } = diagnostics;
  const isOverflow = overflow > 0;
  const usageRatio = limit > 0 ? Math.max(0, Math.min(used / limit, 1)) : 0;

  return (
    <div
      className={`mb-3 space-y-2 rounded-3xl px-4 py-3 text-sm shadow-sm ${
        isOverflow
          ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
          : 'bg-slate-900 text-slate-100 ring-1 ring-slate-800'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
        <div className="flex items-center gap-2">
          {isOverflow ? <AlertTriangleIcon size={16} aria-hidden /> : null}
          <span className="font-medium">
            Hauteur utilisée&nbsp;: {used}px / {limit}px ({ratioLabel})
          </span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide">
          {isOverflow ? `Débord +${overflow}px` : `Marge ${slack}px`}
        </span>
      </div>
      <div
        className={`h-1.5 w-full rounded-full ${isOverflow ? 'bg-red-100/80' : 'bg-white/20'}`}
        aria-hidden
      >
        <span
          className={`block h-full rounded-full transition-[width] duration-300 ${isOverflow ? 'bg-red-500/80' : 'bg-white/90'}`}
          style={{ width: `${Math.round(usageRatio * 100)}%` }}
        />
      </div>
    </div>
  );
}
