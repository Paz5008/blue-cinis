import React, { useRef, useCallback } from 'react';
import { type ImageBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import { FilterControls } from './shared/FilterControls';
import type { InspectorProps } from './types';
import NumberSliderInput from '../controls/NumberSliderInput';
import EnumSegmented from '../controls/EnumSegmented';
import { AlignLeft as AlignLeftIcon, AlignCenter as AlignCenterIcon, AlignRight as AlignRightIcon } from 'lucide-react';

export function ImageInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps<ImageBlock>) {
    const b = block;
    const altInputRef = useRef<HTMLInputElement | null>(null);

    const buildAltSuggestions = useCallback(
        (caption?: string, current?: string): string[] => {
            const set = new Set<string>();
            const trimmedCaption = typeof caption === 'string' ? caption.trim() : '';
            const trimmedCurrent =
                typeof current === 'string' && !/^image\d+$/i.test(current.trim()) ? current.trim() : '';
            if (trimmedCaption) {
                set.add(trimmedCaption);
                set.add(`Œuvre — ${trimmedCaption}`);
            }
            if (trimmedCurrent) set.add(trimmedCurrent);
            const contextLabel =
                pageKey === 'banner' ? 'Bandeau' : pageKey === 'poster' ? 'Affiche' : 'Profil';
            set.add(`${contextLabel} — ${trimmedCaption || 'visuel principal'}`);
            return Array.from(set).filter(Boolean).slice(0, 3);
        },
        [pageKey]
    );

    const altSuggestions = buildAltSuggestions(b.caption, b.altText);
    const decorative = Boolean(b.decorative);

    const isAltMissing = (value: string | undefined, isDecorative: boolean) => {
        if (isDecorative) return false;
        const normalized = typeof value === 'string' ? value.trim() : '';
        if (!normalized) return true;
        return /^image\d+$/i.test(normalized);
    };

    const defaultAltSuggestion = (() => {
        if (altSuggestions.length > 0) {
            return altSuggestions[altSuggestions.length - 1];
        }
        return pageKey === 'banner'
            ? 'Bandeau — visuel principal'
            : pageKey === 'poster'
                ? "Affiche — visuel principal"
                : 'Profil — visuel principal';
    })();

    const handleToggleDecorative = () => {
        const nextDecorative = !decorative;
        const payload = {
            ...block,
            decorative: nextDecorative,
            altText: nextDecorative ? '' : (b.altText || ''),
        };
        onUpdate(payload);
        if (!nextDecorative) {
            setTimeout(() => altInputRef.current?.focus(), 150);
        }
    };

    if (tab === 'content') {
        return (
            <InspectorSection title="Image" defaultOpen>
                {b.src && <img src={b.src} alt="" className="w-full h-24 object-cover rounded mb-2 border border-gray-200" />}
                <div className="flex gap-2 mb-3">
                    <button type="button" className="px-3 py-1 bg-indigo-600 text-white rounded shadow-sm hover:opacity-90 transition-opacity" onClick={() => setMediaPicker({
                        onSelect: url => {
                            const current = block;
                            const nextAlt = isAltMissing(current.altText, !!current.decorative)
                                ? defaultAltSuggestion
                                : (current.altText && String(current.altText).trim().length > 0
                                    ? current.altText
                                    : defaultAltSuggestion);
                            onUpdate({ ...block, src: url, altText: nextAlt, decorative: false });
                        }
                    })}>
                        Choisir
                    </button>
                    {b.src && (
                        <button type="button" className="px-3 py-1 border border-gray-200 bg-white rounded text-slate-900 hover:bg-gray-50 transition-colors" onClick={() => onUpdate({ ...block, src: '' })}>
                            Retirer
                        </button>
                    )}
                </div>
                <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-medium text-slate-900">Utiliser comme image décorative</p>
                            <p className="text-xs text-slate-500">
                                Marquez l’image décorative si elle n’apporte pas d’information.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={decorative}
                            onClick={handleToggleDecorative}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${decorative ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                            <span className="sr-only">Basculer l’image en décoratif</span>
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${decorative ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
                <label className="block text-sm font-medium mb-1 text-slate-900">Texte alternatif</label>
                <input
                    ref={altInputRef}
                    type="text"
                    value={b.altText || ''}
                    onChange={e => onUpdate({ ...block, altText: e.target.value, decorative: false })}
                    className="w-full p-2 border border-gray-200 bg-white rounded mb-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={decorative ? 'Image décorative (alt vide)' : 'Décrivez brièvement l’image'}
                    disabled={decorative}
                />
                {altSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {altSuggestions.map(suggestion => (
                            <button
                                key={suggestion}
                                type="button"
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-colors"
                                onClick={() => onUpdate({ ...block, altText: suggestion, decorative: false })}
                                disabled={decorative}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
                {isAltMissing(b.altText, decorative) && (
                    <div className="text-xs text-amber-600 mb-2 font-medium">
                        Texte alternatif recommandé. <button type="button" className="underline hover:text-amber-800" onClick={() => altInputRef.current?.focus()}>Éditer maintenant</button>
                    </div>
                )}
                <label className="block text-sm font-medium mb-1 text-slate-900">Légende</label>
                <input type="text" value={b.caption || ''} onChange={e => onUpdate({ ...block, caption: e.target.value })} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:outline-none" />
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} skipDimensions={true} />
                <InspectorSection
                    title="Paramètres"
                    defaultOpen
                    help="Ajustez l'alignement et la taille logique du bloc image dans le flux. Les dimensions précises se règlent dans Styles."
                >
                    <label className="block text-sm font-medium mb-1 text-slate-900">Taille</label>
                    <div className="mb-3">
                        <EnumSegmented
                            value={(b as any).size || 'medium'}
                            options={['small', 'medium', 'large', 'full']}
                            onChange={val => onUpdate({ ...block, size: val as any } as any)}
                            labels={{ small: 'Petit', medium: 'Moyen', large: 'Grand', full: 'Plein' }}
                        />
                    </div>

                    <label className="block text-sm font-medium mb-1 text-slate-900">Alignement</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        {[
                            { value: 'left', icon: <AlignLeftIcon size={16} /> },
                            { value: 'center', icon: <AlignCenterIcon size={16} /> },
                            { value: 'right', icon: <AlignRightIcon size={16} /> }
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onUpdate({ ...block, alignment: option.value as any })}
                                className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all text-sm ${(b.alignment || 'center') === option.value
                                    ? 'bg-white text-indigo-600 shadow-sm font-medium'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-gray-200/50'
                                    }`}
                                title={option.value}
                            >
                                {option.icon}
                            </button>
                        ))}
                    </div>
                </InspectorSection>
                <FilterControls block={block} onUpdate={onUpdate} />
            </>
        );
    }

    if (tab === 'styles') {
        const getNum = (v: any, axis: 'w' | 'h') => {
            const s = (v || '0').toString();
            if (typeof window !== 'undefined' && s.endsWith('px')) {
                const n = parseInt(s, 10) || 0;
                return Math.round((n / (axis === 'w' ? window.innerWidth : window.innerHeight)) * 100);
            }
            if (s.endsWith('vw') || s.endsWith('vh') || s.endsWith('%')) return parseInt(s, 10) || 0;
            return parseInt(s, 10) || 0;
        };
        const w = getNum(b?.style?.width, 'w');
        const h = getNum(b?.style?.height, 'h');
        const ar = b.aspectRatio && b.aspectRatio > 0 ? b.aspectRatio : (w > 0 && h > 0 ? w / h : undefined);

        return (
            <>
                <InspectorSection title="Dimensions" defaultOpen>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-slate-900">Taille personnalisée</div>
                        <label className="text-sm inline-flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                            <input type="checkbox" checked={!!b.keepAspect} onChange={e => onUpdate({ ...block, keepAspect: e.target.checked })} className="accent-indigo-600" />
                            Verrouiller le ratio
                        </label>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <label className="block text-xs mb-1 text-slate-500">Largeur (%)</label>
                            <input type="range" min={0} max={100} value={w} onChange={e => {
                                const newW = parseInt(e.target.value, 10) || 0;
                                const style = { ...(b.style || {}), width: `${newW}vw` };
                                if (b.keepAspect && newW > 0 && ar) style.height = `${Math.round(newW / ar)}vw`;
                                onUpdate({ ...block, style });
                            }} className="w-full accent-indigo-600" />
                            <input type="number" min={0} max={100} value={w} onChange={e => {
                                const newW = parseInt(e.target.value || '0', 10) || 0;
                                const style = { ...(b.style || {}), width: `${newW}vw` };
                                if (b.keepAspect && newW > 0 && ar) style.height = `${Math.round(newW / ar)}vw`;
                                onUpdate({ ...block, style });
                            }} className="w-full p-2 border bg-white border-gray-200 text-slate-900 focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs mb-1 text-slate-500">Hauteur (%)</label>
                            <input type="range" min={0} max={100} value={h} onChange={e => {
                                const newH = parseInt(e.target.value, 10) || 0;
                                const style = { ...(b.style || {}), height: `${newH}vh` };
                                if (b.keepAspect && newH > 0 && ar) style.width = `${Math.round(newH * ar)}vw`;
                                onUpdate({ ...block, style });
                            }} className="w-full accent-indigo-600" />
                            <input type="number" min={0} max={100} value={h} onChange={e => {
                                const newH = parseInt(e.target.value || '0', 10) || 0;
                                const style = { ...(b.style || {}), height: `${newH}vh` };
                                if (b.keepAspect && newH > 0 && ar) style.width = `${Math.round(newH * ar)}vw`;
                                onUpdate({ ...block, style });
                            }} className="w-full p-2 border bg-white border-gray-200 text-slate-900 focus:border-indigo-500 focus:outline-none" />
                            <p className="text-[11px] text-slate-500 mt-1 ml-1 opacity-70">Astuce: mettez 0 pour la hauteur auto</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" className="px-2 py-1 text-xs border border-gray-200 bg-white rounded text-slate-500 hover:bg-gray-50 hover:text-slate-900 transition-colors" onClick={() => onUpdate({ ...block, style: { ...(b.style || {}), width: undefined, height: undefined } })}>Réinitialiser</button>
                    </div>
                </InspectorSection>
                <InspectorSection title="Effets" defaultOpen={false}>
                    <div className="space-y-4">
                        <div>
                            <div className="mb-1 text-sm font-medium text-slate-900">Opacité (%)</div>
                            <NumberSliderInput
                                value={Math.round((b.style?.opacity !== undefined ? Number(b.style.opacity) : 1) * 100)}
                                onChange={(val) => onUpdate({ ...block, style: { ...(b.style || {}), opacity: val / 100 } })}
                                min={0}
                                max={100}
                                step={5}
                                unit="%"
                            />
                        </div>
                    </div>
                </InspectorSection>
                <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />
            </>
        );
    }

    return null;
}
