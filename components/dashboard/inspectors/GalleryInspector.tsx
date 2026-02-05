import React, { useRef } from 'react';
import { type GalleryImage, type GalleryBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import type { InspectorProps } from './types';
import NumberSliderInput from '../controls/NumberSliderInput';

export function GalleryInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps<GalleryBlock>) {
    const b = block;
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const isAltMissing = (value: string | undefined, isDecorative: boolean | undefined) => {
        if (isDecorative) return false;
        const normalized = typeof value === 'string' ? value.trim() : '';
        if (!normalized) return true;
        return /^image\d+$/i.test(normalized);
    };

    const updateImage = (index: number, mutator: (img: GalleryImage) => GalleryImage) => {
        const imgs = Array.isArray(b.images) ? [...b.images] : [];
        if (!imgs[index]) return;
        imgs[index] = mutator(imgs[index]);
        onUpdate({ ...block, images: imgs });
    };

    if (tab === 'content') {
        const missing = (b.images || [])
            .map((img, i) => ({ i, ok: !isAltMissing(img.altText, img.decorative) }))
            .filter(entry => !entry.ok);

        return (
            <InspectorSection title="Galerie" defaultOpen>
                {missing.length > 0 && (
                    <div className="mb-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded p-2">
                        {missing.length} image(s) sans ALT personnalisé. Accès direct:{' '}
                        {missing.map(x => (
                            <button
                                key={x.i}
                                className="underline mr-1 hover:text-amber-800"
                                onClick={() => {
                                    const el = inputRefs.current[x.i];
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setTimeout(() => el?.focus(), 250);
                                }}
                            >
                                #{x.i + 1}
                            </button>
                        ))}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 mb-2">
                    {(b.images || []).map((img, i) => {
                        const decorative = Boolean(img.decorative);
                        return (
                            <div key={img.id || i} className="border border-gray-200 bg-white relative group">
                                <div className="relative mb-2">
                                    <img src={img.src} alt={img.altText || ''} className="h-20 w-full object-cover rounded border border-gray-200" />
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 hidden h-6 w-6 items-center justify-center rounded-full bg-white text-red-600 shadow-sm opacity-90 hover:opacity-100 group-hover:flex"
                                        onClick={() => onUpdate({ ...block, images: (b.images || []).filter((_, idx) => idx !== i) })}
                                        title="Supprimer l'image"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium text-slate-500">Image décorative</span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={decorative}
                                        onClick={() =>
                                            updateImage(i, current => ({
                                                ...current,
                                                decorative: !current.decorative,
                                                altText: !current.decorative ? '' : (current.altText || ''),
                                            }))
                                        }
                                        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${decorative ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                    >
                                        <span className="sr-only">Basculer l’image #{i + 1} en décoratif</span>
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${decorative ? 'translate-x-4' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-slate-900">Texte alternatif</label>
                                        <input
                                            ref={el => { inputRefs.current[i] = el; }}
                                            type="text"
                                            value={img.altText || ''}
                                            placeholder={decorative ? 'Image décorative (alt vide)' : 'Décrivez cette image'}
                                            onChange={e => updateImage(i, current => ({ ...current, altText: e.target.value, decorative: false }))}
                                            className="w-full p-2 border border-gray-200 bg-white rounded text-xs text-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={decorative}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-slate-900">Légende</label>
                                        <input
                                            type="text"
                                            value={img.caption || ''}
                                            onChange={e => updateImage(i, current => ({ ...current, caption: e.target.value }))}
                                            className="w-full p-2 border border-gray-200 bg-white rounded text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="w-full rounded border border-gray-200 bg-white hover:bg-gray-50 px-2 py-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                                        onClick={() =>
                                            setMediaPicker({
                                                onSelect: url => {
                                                    const nextAlt =
                                                        img.altText && !/^image\d+$/i.test(String(img.altText).trim())
                                                            ? img.altText
                                                            : `image${i + 1}`;
                                                    updateImage(i, current => ({ ...current, src: url, altText: nextAlt, decorative: false }));
                                                },
                                            })
                                        }
                                    >
                                        Remplacer
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-gray-200 bg-white text-sm text-slate-500 transition hover:border-slate-900 hover:text-slate-900"
                        onClick={() =>
                            setMediaPicker({
                                onSelect: url => {
                                    const nextIndex = (b.images?.length || 0) + 1;
                                    const alt = `image${nextIndex}`;
                                    onUpdate({
                                        ...block,
                                        images: [...(b.images || []), { id: self.crypto.randomUUID(), src: url, altText: alt, decorative: false }],
                                    });
                                },
                            })
                        }
                    >
                        <span className="text-2xl opacity-50">+</span>
                        <span>Ajouter une image</span>
                    </button>
                </div>
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        const clampIntValue = (value: number, min?: number, max?: number) => {
            let next = Math.round(value);
            if (!Number.isFinite(next)) next = min ?? (max ?? 0);
            if (min !== undefined && next < min) next = min;
            if (max !== undefined && next > max) next = max;
            return next;
        };
        const readIntOr = (value: any, fallback: number) => {
            if (value === null || value === undefined || value === '') return fallback;
            const parsed = Number.parseInt(String(value), 10);
            return Number.isFinite(parsed) ? parsed : fallback;
        };
        const safeIntInput = (raw: string, fallback: number, opts?: { min?: number; max?: number }) => {
            return clampIntValue(Number.parseInt(raw, 10), opts?.min, opts?.max);
        };

        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} />
                <InspectorSection title="Disposition" defaultOpen help="Définissez l'organisation de la galerie.">
                    <label className="block text-sm font-medium mb-1 text-slate-900">Colonnes</label>
                    <NumberSliderInput
                        value={safeIntInput((b.columns || 3).toString(), 3)}
                        onChange={(val) => onUpdate({ ...block, columns: val })}
                        min={1}
                        max={6}
                        step={1}
                    />
                </InspectorSection>
            </>
        );
    }

    if (tab === 'styles') {
        return <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />;
    }

    return null;
}
