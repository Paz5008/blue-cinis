"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useState, useMemo } from 'react';
import clsx from 'clsx';
import { Search, SlidersHorizontal, Check, X } from 'lucide-react';

type CategoryOption = { id: string; name: string };

interface GalleryFiltersProps {
  className?: string;
  categories?: CategoryOption[];
}

const PRICE_RANGES = [
  { label: 'Moins de 500€', min: '', max: '500' },
  { label: '500€ - 1 000€', min: '500', max: '1000' },
  { label: '1 000€ - 5 000€', min: '1000', max: '5000' },
  { label: 'Plus de 5 000€', min: '5000', max: '' },
];

export default function GalleryFilters({ className, categories = [] }: GalleryFiltersProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [min, setMin] = useState(searchParams.get('min') || '');
  const [max, setMax] = useState(searchParams.get('max') || '');
  const [available, setAvailable] = useState(searchParams.get('available') === '1');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [isOpen, setIsOpen] = useState(true); // Mobile toggle

  // Debounce apply
  const apply = useCallback((overrides?: any) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const state = { q, min, max, available, sort, categoryId, ...overrides };

    if (state.q) params.set('q', state.q); else params.delete('q');
    if (state.min) params.set('min', state.min); else params.delete('min');
    if (state.max) params.set('max', state.max); else params.delete('max');
    if (state.available) params.set('available', '1'); else params.delete('available');
    if (state.sort) params.set('sort', state.sort); else params.delete('sort');
    if (state.categoryId) params.set('categoryId', state.categoryId); else params.delete('categoryId');

    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [q, min, max, available, sort, categoryId, searchParams, router, pathname]);

  const updatePriceRange = (range: { min: string, max: string } | null) => {
    if (!range) {
      setMin('');
      setMax('');
      apply({ min: '', max: '' });
    } else {
      setMin(range.min);
      setMax(range.max);
      apply({ min: range.min, max: range.max });
    }
  };

  const activePriceLabel = useMemo(() => {
    if (!min && !max) return null;
    const found = PRICE_RANGES.find(r => r.min === min && r.max === max);
    return found ? found.label : `${min || '0'}€ - ${max || '∞'}€`;
  }, [min, max]);

  const activeCategoryLabel = useMemo(() => {
    return categories.find(c => c.id === categoryId)?.name;
  }, [categories, categoryId]);

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Mobile Toggle */}
      <div className="lg:hidden flex justify-between items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold border border-subtle px-4 py-2 rounded-full"
        >
          <SlidersHorizontal size={16} />
          Filtres & Tri
        </button>
      </div>

      <div className={clsx("bg-white dark:bg-slate-900/95 rounded-3xl p-6 shadow-sm border border-subtle space-y-8", !isOpen && "hidden lg:block")}>

        {/* Search & Sort Row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setTimeout(() => apply({ q: e.target.value }), 500); }}
              placeholder="Rechercher une œuvre..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-subtle bg-surface-strong focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-body-subtle" size={18} />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); apply({ sort: e.target.value }); }}
              className="px-4 py-2.5 rounded-xl border border-subtle bg-surface-strong text-sm font-medium focus:ring-2 focus:ring-accent outline-none cursor-pointer hover:border-accent"
            >
              <option value="newest">Nouveautés</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="bestsellers">Populaires</option>
            </select>

            <button
              onClick={() => { setAvailable(!available); apply({ available: !available }); }}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap",
                available ? "bg-accent/10 border-accent text-accent" : "border-subtle hover:border-accent text-body"
              )}
            >
              {available && <Check size={16} />}
              Disponibles uniquement
            </button>
          </div>
        </div>

        <div className="h-px bg-subtle" />

        {/* Facets Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Price Ranges */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-body-subtle">Prix</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={clsx("w-5 h-5 rounded-full border flex items-center justify-center transition", !min && !max ? "border-accent bg-accent" : "border-subtle group-hover:border-accent")}>
                  {(!min && !max) && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className={clsx("text-sm", !min && !max ? "font-medium text-heading" : "text-body")}>Tous les prix</span>
                <input type="radio" checked={!min && !max} onChange={() => updatePriceRange(null)} className="hidden" />
              </label>
              {PRICE_RANGES.map((range) => {
                const isSelected = min === range.min && max === range.max;
                return (
                  <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                    <div className={clsx("w-5 h-5 rounded-full border flex items-center justify-center transition", isSelected ? "border-accent bg-accent" : "border-subtle group-hover:border-accent")}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={clsx("text-sm", isSelected ? "font-medium text-heading" : "text-body")}>{range.label}</span>
                    <input type="radio" checked={isSelected} onChange={() => updatePriceRange(range)} className="hidden" />
                  </label>
                )
              })}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3 lg:col-span-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-body-subtle">Catégories</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setCategoryId(''); apply({ categoryId: '' }); }}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  !categoryId ? "bg-heading text-white" : "bg-surface-strong text-body hover:bg-subtle"
                )}
              >
                Toutes
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryId(cat.id); apply({ categoryId: cat.id }); }}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-sm transition-colors",
                    categoryId === cat.id ? "bg-heading text-white" : "bg-surface-strong text-body hover:bg-subtle"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Technique / Others (Placeholder for now) */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-body-subtle">Filtres actifs</h3>
            <div className="flex flex-wrap gap-2">
              {activePriceLabel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                  {activePriceLabel}
                  <button onClick={() => updatePriceRange(null)}><X size={12} /></button>
                </span>
              )}
              {activeCategoryLabel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-heading/10 text-heading text-xs font-semibold rounded-full">
                  {activeCategoryLabel}
                  <button onClick={() => { setCategoryId(''); apply({ categoryId: '' }); }}><X size={12} /></button>
                </span>
              )}
              {available && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  Disponibles
                  <button onClick={() => { setAvailable(false); apply({ available: false }); }}><X size={12} /></button>
                </span>
              )}
              {!activePriceLabel && !activeCategoryLabel && !available && (
                <span className="text-sm text-body-subtle italic">Aucun filtre</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
