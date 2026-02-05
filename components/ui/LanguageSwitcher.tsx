"use client";

import { useState, useEffect, useTransition } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';

const LANGUAGES: Array<{ code: 'fr' | 'en'; label: string }> = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const { locale: contextLocale } = useI18n();
  const [pendingLocale, setPendingLocale] = useState<'fr' | 'en' | null>(null);
  const [isPending, startTransition] = useTransition();
  const locale = pendingLocale ?? contextLocale;

  useEffect(() => {
    if (pendingLocale && pendingLocale === contextLocale) {
      setPendingLocale(null);
    }
  }, [pendingLocale, contextLocale]);

  const switchLanguage = (lang: 'fr' | 'en') => {
    if (lang === locale) {
      return;
    }
    try {
      document.cookie = `locale=${lang}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
    } catch {
      /* noop */
    }
    setPendingLocale(lang);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[color:var(--surface-border-soft)] bg-[color:var(--surface-glass)] p-0.5">
      {LANGUAGES.map(({ code, label }) => {
        const isActive = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchLanguage(code)}
            className={clsx(
              'min-w-[2.5rem] rounded-full px-2 py-1 text-xs font-semibold transition-colors duration-150',
              isActive
                ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-contrast)] shadow-sm'
                : 'text-[color:var(--text-body-subtle)] hover:text-[color:var(--nav-text-hover)]',
              (isPending && pendingLocale === code) && 'opacity-60'
            )}
            aria-pressed={isActive}
            disabled={isPending && pendingLocale === code}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
