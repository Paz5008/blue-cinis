import React from 'react';
import { PenLine as PenLineIcon, Sparkles as SparklesIcon } from 'lucide-react';

export type BannerStage = 'compose' | 'optimize';

interface BannerStageToggleProps {
  stage: BannerStage;
  onStageChange: (stage: BannerStage) => void;
  disabled?: boolean;
}

export function BannerStageToggle({ stage, onStageChange, disabled = false }: BannerStageToggleProps) {
  const handleChange = (next: BannerStage) => {
    if (disabled || next === stage) return;
    onStageChange(next);
  };

  const baseButton =
    'inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1';

  return (
    <div
      role="group"
      aria-label="Étapes bandeau"
      className={`inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white/90 p-0.5 ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => handleChange('compose')}
        aria-pressed={stage === 'compose'}
        className={`${baseButton} ${
          stage === 'compose'
            ? 'bg-slate-900 text-white shadow'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
        }`}
        disabled={disabled}
      >
        <PenLineIcon size={14} />
        <span className="hidden lg:inline">Composer</span>
        <span className="sr-only lg:hidden">Composer</span>
      </button>
      <button
        type="button"
        onClick={() => handleChange('optimize')}
        aria-pressed={stage === 'optimize'}
        className={`${baseButton} ${
          stage === 'optimize'
            ? 'bg-indigo-600 text-white shadow'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
        }`}
        disabled={disabled}
      >
        <SparklesIcon size={14} />
        <span className="hidden lg:inline">Optimiser</span>
        <span className="sr-only lg:hidden">Optimiser</span>
      </button>
    </div>
  );
}
