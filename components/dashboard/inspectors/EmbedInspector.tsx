import React from 'react';
import { isEmbedBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { resolveEmbedProvider, type EmbedProvider } from '@/lib/cms/embed';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import type { InspectorProps } from './types';

export function EmbedInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps) {
    if (!isEmbedBlock(block)) return null;
    const b = block;
    const detectedProvider = resolveEmbedProvider(b.url);
    const provider = (b.provider as EmbedProvider | undefined) || detectedProvider;

    if (tab === 'content') {
        return (
            <InspectorSection
                title="Intégration externe"
                defaultOpen
                help="Collez une URL YouTube, Vimeo ou SoundCloud. Nous générons automatiquement un lecteur sécurisé."
            >
                <label className="block text-sm font-medium mb-1 text-slate-900">URL embarquée</label>
                <input
                    type="url"
                    inputMode="url"
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={b.url || ''}
                    onChange={e => onUpdate({ ...block, url: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-3"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">Fournisseur</label>
                        <select
                            value={b.provider || detectedProvider || ''}
                            onChange={e => {
                                const value = e.target.value;
                                onUpdate({ ...block, provider: value ? (value as EmbedProvider) : undefined });
                            }}
                            className="w-full rounded border border-gray-200 bg-white text-slate-900 px-2 py-1.5 text-sm"
                        >
                            <option value="">Auto ({detectedProvider ? `détecté: ${detectedProvider}` : 'aucun'})</option>
                            <option value="youtube">YouTube</option>
                            <option value="vimeo">Vimeo</option>
                            <option value="soundcloud">SoundCloud</option>
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Fournisseur détecté: {provider ?? 'non détecté'}.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">Titre (accessibilité)</label>
                        <input
                            type="text"
                            value={b.title || ''}
                            onChange={e => onUpdate({ ...block, title: e.target.value })}
                            className="w-full rounded border border-gray-200 bg-white text-slate-900 px-2 py-1.5 text-sm"
                            placeholder="Ex: Présentation atelier — 2 min"
                        />
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">Aspect ratio</label>
                        <input
                            type="text"
                            value={b.aspectRatio || '16:9'}
                            onChange={e => onUpdate({ ...block, aspectRatio: e.target.value })}
                            className="w-full rounded border border-gray-200 bg-white text-slate-900 px-2 py-1.5 text-sm"
                            placeholder="16:9"
                        />
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-900">
                        <input
                            type="checkbox"
                            checked={b.allowFullscreen !== false}
                            onChange={e => onUpdate({ ...block, allowFullscreen: e.target.checked })}
                            className="accent-indigo-600"
                        />
                        Autoriser le plein écran
                    </label>
                </div>
                <div className="mt-3">
                    <label className="block text-sm font-medium mb-1 text-slate-900">Légende (facultatif)</label>
                    <textarea
                        value={b.caption || ''}
                        onChange={e => onUpdate({ ...block, caption: e.target.value })}
                        className="w-full rounded border border-gray-200 bg-white text-slate-900 px-2 py-1.5 text-sm"
                        rows={2}
                        placeholder="Ajoutez un contexte pour vos visiteurs."
                    />
                </div>
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return <CommonSettings block={block} onUpdate={onUpdate} skipDimensions={true} />;
    }

    if (tab === 'styles') {
        return <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />;
    }

    return null;
}
