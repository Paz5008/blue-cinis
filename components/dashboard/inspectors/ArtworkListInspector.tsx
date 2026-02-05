import React from 'react';
import type { Block, ArtworkListBlock } from '@/types/cms';
import { isArtworkListBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import type { InspectorProps } from './types';

export function ArtworkListInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps) {
    if (!isArtworkListBlock(block)) return null;
    const b = block;

    if (tab === 'content') {
        return (
            <InspectorSection title="Source de données" defaultOpen>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">Mode de sélection</label>
                        <div className="flex rounded-md shadow-sm" role="group">
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-medium rounded-l-lg border transition-colors ${b.mode === 'manual'
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50 hover:text-slate-900'
                                    }`}
                                onClick={() => onUpdate({ ...b, mode: 'manual' } as Block)}
                            >
                                Manuel
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r transition-colors ${b.mode === 'query'
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50 hover:text-slate-900'
                                    }`}
                                onClick={() => onUpdate({ ...b, mode: 'query' } as Block)}
                            >
                                Dynamique
                            </button>
                        </div>
                    </div>

                    {b.mode === 'manual' ? (
                        <p className="text-sm text-slate-500 italic">
                            Utilisez le bloc "Œuvres" standard pour une sélection manuelle précise.
                            Ce mode est conservé pour compatibilité.
                        </p>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-900">Recherche (Titres, Mots-clés)</label>
                                <input type="text" value={b.query?.search || ''} onChange={e => onUpdate({ ...b, query: { ...b.query, search: e.target.value } } as Block)} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:outline-none" placeholder="ex: Abstrait, Bleu..." />
                            </div>
                            <div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-900">Filtre Statut</label>
                                    <select value={b.query?.status || 'all'} onChange={e => onUpdate({ ...b, query: { ...b.query, status: e.target.value } } as Block)} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:outline-none">
                                        <option value="all">Tous</option>
                                        <option value="available">Disponibles uniquement</option>
                                        <option value="sold">Vendus uniquement</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">Tri</label>
                        <div className="flex gap-2">
                            <select value={b.sortBy || 'createdAt'} onChange={e => onUpdate({ ...b, sortBy: e.target.value } as Block)} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:outline-none">
                                <option value="createdAt">Date d'ajout</option>
                                <option value="price">Prix</option>
                                <option value="title">Titre</option>
                                <option value="year">Année</option>
                            </select>
                            <select value={b.sortOrder || 'desc'} onChange={e => onUpdate({ ...b, sortOrder: e.target.value } as Block)} className="w-24 p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:outline-none">
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">Nombre d'éléments</label>
                        <input type="number" value={b.limit || 8} onChange={e => onUpdate({ ...b, limit: parseInt(e.target.value) } as Block)} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:outline-none" />
                    </div>
                </div>
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} />
                <InspectorSection title="Mise en page" defaultOpen>
                    <label className="block text-sm font-medium mb-1 text-slate-900">Type d'affichage</label>
                    <select value={b.layout || 'grid'} onChange={e => onUpdate({ ...b, layout: e.target.value } as Block)} className="w-full p-2 border border-gray-200 bg-white rounded mb-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none">
                        <option value="grid">Grille</option>
                        <option value="carousel">Carrousel (Scroll horizontal)</option>
                        <option value="masonry">Mosaïque (Masonry)</option>
                    </select>

                    <label className="block text-sm font-medium mb-1 text-slate-900">Colonnes</label>
                    <input type="range" min="1" max="6" value={b.columns || 3} onChange={e => onUpdate({ ...b, columns: parseInt(e.target.value) } as Block)} className="w-full mb-2 accent-indigo-600" />

                    {b.layout !== 'carousel' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-900">Pagination</label>
                            <select value={b.paginationType || 'none'} onChange={e => onUpdate({ ...b, paginationType: e.target.value } as Block)} className="w-full p-2 border bg-white border-gray-200 text-slate-900 focus:border-indigo-500 focus:outline-none">
                                <option value="none">Aucune (Tout charger)</option>
                                <option value="loadMore">Bouton "Voir plus"</option>
                                <option value="infinite">Défilement infini</option>
                                <option value="numbered">Pages numérotées</option>
                            </select>
                        </div>
                    )}
                </InspectorSection>
                <InspectorSection title="Champs visibles">
                    {['Title', 'Artist', 'Price', 'Year', 'Dimensions'].map(field => {
                        const key = `show${field}`;
                        return (
                            <label key={key} className="flex items-center gap-2 mb-1 text-slate-900 cursor-pointer select-none">
                                <input type="checkbox" checked={(b as unknown as Record<string, unknown>)[key] !== false} onChange={e => onUpdate({ ...b, [key]: e.target.checked } as Block)} className="accent-indigo-600" />
                                {field === 'Title' ? 'Titre' : field === 'Artist' ? 'Artiste' : field === 'Price' ? 'Prix' : field === 'Year' ? 'Année' : 'Dimensions'}
                            </label>
                        );
                    })}
                </InspectorSection>
            </>
        );
    }

    if (tab === 'styles') {
        return (
            <>
                <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />
                {/* Could reuse Oeuvre typography styles here if we extract them further, duplications acceptable for now given slight diffs */}
            </>
        );
    }

    return null;
}
