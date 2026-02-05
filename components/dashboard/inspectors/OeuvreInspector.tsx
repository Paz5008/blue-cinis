import React from 'react';
import type { Block, OeuvreBlock } from '@/types/cms';
import { isOeuvreBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import MultiEntityPicker from '../controls/MultiEntityPicker';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import type { InspectorProps } from './types';

export function OeuvreInspector({ block, onUpdate, tab, setMediaPicker, oeuvreOptions, pageKey }: InspectorProps) {
    if (!isOeuvreBlock(block)) return null;
    const b = block;

    if (tab === 'content') {
        return (
            <InspectorSection title="Sélection d'œuvres" defaultOpen>
                <MultiEntityPicker
                    value={b.artworks || []}
                    options={oeuvreOptions || []}
                    onChange={ids => onUpdate({ ...block, artworks: ids } as Block)}
                />
                <div className="mt-3">
                    <label className="block text-sm font-medium mb-1 text-slate-900">Trier par</label>
                    <div className="flex gap-2 mb-2">
                        <select
                            value={b.sortBy || 'manual'}
                            onChange={e => onUpdate({ ...block, sortBy: e.target.value } as Block)}
                            className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="manual">Manuel (Drag & Drop)</option>
                            <option value="createdAt">Date de création</option>
                            <option value="title">Titre (A-Z)</option>
                            <option value="price">Prix</option>
                        </select>
                        {b.sortBy !== 'manual' && (
                            <select
                                value={b.sortOrder || 'desc'}
                                onChange={e => onUpdate({ ...block, sortOrder: e.target.value } as Block)}
                                className="w-24 p-2 border border-gray-200 rounded bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                        )}
                    </div>
                    <label className="block text-sm font-medium mb-1 text-slate-900">Limite</label>
                    <input
                        type="number"
                        value={b.limit || ''}
                        placeholder="Toutes"
                        onChange={e => onUpdate({ ...block, limit: e.target.value ? parseInt(e.target.value, 10) : undefined } as Block)}
                        className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} />
                <InspectorSection title="Affichage des métadonnées" defaultOpen>
                    <div className="space-y-2">
                        {[
                            ['showTitle', 'Titre'],
                            ['showArtist', 'Artiste'],
                            ['showPrice', 'Prix'],
                            ['showYear', 'Année'],
                            ['showDimensions', 'Dimensions'],
                            ['showDescription', 'Description'],
                            ['showTechnique', 'Technique'],
                            ['showStatus', 'Statut (Vendu/Réservé)'],
                            ['showAvailability', 'Badge disponibilité']
                        ].map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-slate-900">
                                <input
                                    type="checkbox"
                                    checked={(b as unknown as Record<string, unknown>)[key] !== false}
                                    onChange={e => onUpdate({ ...block, [key]: e.target.checked } as Block)}
                                    className="accent-indigo-600"
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                    <div className="mt-3">
                        <label className="block text-sm font-medium mb-1 text-slate-900">Format de carte</label>
                        <select
                            value={b.cardStyle || 'minimal'}
                            onChange={e => onUpdate({ ...block, cardStyle: e.target.value } as Block)}
                            className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="minimal">Minimal (Image + Texte dessous)</option>
                            <option value="overlay">Overlay (Texte sur survol)</option>
                            <option value="boxed">Boxed (Cadre avec fond)</option>
                        </select>
                    </div>
                </InspectorSection>
                <InspectorSection title="Grille" defaultOpen>
                    <label className="block text-sm font-medium mb-1 text-slate-900">Colonnes</label>
                    <input type="range" min="1" max="6" step="1" value={b.columns || 3} onChange={e => onUpdate({ ...block, columns: parseInt(e.target.value) } as Block)} className="w-full accent-indigo-600" />
                    <div className="flex justify-between text-xs text-slate-500 mb-2"><span>1</span><span>6</span></div>
                </InspectorSection>
            </>
        );
    }

    if (tab === 'styles') {
        return (
            <>
                <InspectorSection title="Typographie Cartes" defaultOpen>
                    <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Titre</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <input type="number" placeholder="Size (px)" value={parseInt(b.titleFontSize || '16')} onChange={e => onUpdate({ ...block, titleFontSize: `${e.target.value}px` } as Block)} className="p-2 border border-gray-200 rounded bg-white text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        <input type="color" value={b.titleColor || '#000000'} onChange={e => onUpdate({ ...block, titleColor: e.target.value } as Block)} className="h-9 w-full border-none bg-transparent" />
                    </div>

                    <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Dimensions / Année</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <input type="number" placeholder="Size (px)" value={parseInt(b.dimensionsFontSize || '14')} onChange={e => onUpdate({ ...block, dimensionsFontSize: `${e.target.value}px` } as Block)} className="p-2 border border-gray-200 rounded bg-white text-slate-900 text-sm" />
                        <input type="color" value={b.dimensionsColor || '#666666'} onChange={e => onUpdate({ ...block, dimensionsColor: e.target.value } as Block)} className="h-9 w-full border-none bg-transparent" />
                    </div>

                    <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Description / Prix</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <input type="number" placeholder="Size (px)" value={parseInt(b.descriptionFontSize || '14')} onChange={e => onUpdate({ ...block, descriptionFontSize: `${e.target.value}px` } as Block)} className="p-2 border border-gray-200 rounded bg-white text-slate-900 text-sm" />
                        <input type="color" value={b.descriptionColor || '#333333'} onChange={e => onUpdate({ ...block, descriptionColor: e.target.value } as Block)} className="h-9 w-full border-none bg-transparent" />
                    </div>
                </InspectorSection>
                {b.cardStyle === 'boxed' && (
                    <InspectorSection title="Style Carte (Boxed)" defaultOpen>
                        <label className="block text-sm font-medium mb-1 text-slate-900">Fond Carte</label>
                        <input type="color" value={b.cardBackgroundColor || '#ffffff'} onChange={e => onUpdate({ ...block, cardBackgroundColor: e.target.value } as Block)} className="w-full h-9 border-none mb-2 bg-transparent" />
                        <label className="block text-sm font-medium mb-1 text-slate-900">Padding Carte</label>
                        <input type="text" value={b.cardPadding || '16px'} onChange={e => onUpdate({ ...block, cardPadding: e.target.value } as Block)} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-2" />
                        <label className="block text-sm font-medium mb-1 text-slate-900">Rayon Carte</label>
                        <input type="text" value={b.cardBorderRadius || '0px'} onChange={e => onUpdate({ ...block, cardBorderRadius: e.target.value } as Block)} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900" />
                    </InspectorSection>
                )}
                <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />
            </>
        );
    }

    return null;
}
