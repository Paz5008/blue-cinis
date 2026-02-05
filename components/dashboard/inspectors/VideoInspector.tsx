import React from 'react';
import { isVideoBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import type { InspectorProps } from './types';

export function VideoInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps) {
    if (!isVideoBlock(block)) return null;
    const b = block;

    if (tab === 'content') {
        return (
            <InspectorSection title="Vidéo" defaultOpen>
                <label className="block text-sm font-medium mb-1 text-slate-900">URL</label>
                <input type="url" value={b.src || ''} onChange={e => onUpdate({ ...block, src: e.target.value })} className="w-full p-2 border border-gray-200 bg-white text-slate-900 mb-2" />
                <label className="block text-sm font-medium mb-1 text-slate-900">Poster</label>
                {b.poster && <img src={b.poster} alt="Poster" className="w-full h-24 object-cover rounded mb-2 border border-gray-200" />}
                <div className="flex gap-2 mb-2">
                    <button type="button" className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => setMediaPicker({ onSelect: url => onUpdate({ ...block, poster: url }) })}>Choisir</button>
                    {b.poster && <button type="button" className="px-3 py-1 border-gray-200 bg-white text-slate-900" onClick={() => onUpdate({ ...block, poster: '' })}>Retirer</button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={!!b.controls} onChange={e => onUpdate({ ...block, controls: e.target.checked })} className="accent-indigo-600" />Contrôles</label>
                    <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={!!b.autoplay} onChange={e => onUpdate({ ...block, autoplay: e.target.checked })} className="accent-indigo-600" />Autoplay</label>
                    <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={!!b.loop} onChange={e => onUpdate({ ...block, loop: e.target.checked })} className="accent-indigo-600" />Boucle</label>
                    <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={!!b.muted} onChange={e => onUpdate({ ...block, muted: e.target.checked })} className="accent-indigo-600" />Muet</label>
                </div>
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} skipDimensions={true} />
            </>
        );
    }

    if (tab === 'styles') {
        return <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />;
    }

    return null;
}
