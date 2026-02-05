"use client";
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { useI18n } from '@/i18n/provider';

interface SortSelectProps {
  initialSort: string;
  className?: string;
}

const options: Array<{ value: string; labelKey: string }> = [
  { value: 'name_asc', labelKey: 'artists.sort.name_asc' },
  { value: 'name_desc', labelKey: 'artists.sort.name_desc' },
  { value: 'date_desc', labelKey: 'artists.sort.date_desc' },
  { value: 'date_asc', labelKey: 'artists.sort.date_asc' },
  { value: 'artStyle_asc', labelKey: 'artists.sort.style_asc' },
  { value: 'artStyle_desc', labelKey: 'artists.sort.style_desc' },
  { value: 'artworks_desc', labelKey: 'artists.sort.artworks_desc' },
  { value: 'artworks_asc', labelKey: 'artists.sort.artworks_asc' },
];

export default function SortSelect({ initialSort, className }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('sort', newSort);
    router.push(`/artistes?${params.toString()}`);
  };

  return (
    <div className={clsx("flex items-center justify-end", className)}>
      <label htmlFor="sort" className="sr-only">
        {t('artists.sort.label')}
      </label>
      <select
        id="sort"
        name="sort"
        value={initialSort}
        onChange={handleChange}
        className="text-sm font-medium text-[color:var(--text-body)] rounded-full border border-[color:var(--surface-border-soft)] bg-[color:var(--surface-strong)] px-4 py-2 shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-focus)]"
      >
        {options.map(({ value, labelKey }) => (
          <option key={value} value={value}>
            {t(labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
