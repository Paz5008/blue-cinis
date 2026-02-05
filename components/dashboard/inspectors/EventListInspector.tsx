import React from 'react';
import { isEventListBlock, type EventListItem } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import type { InspectorProps } from './types';
import { Plus as PlusIcon, Trash as TrashIcon } from 'lucide-react';

export function EventListInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps) {
    if (!isEventListBlock(block)) return null;
    const b = block;
    const events = Array.isArray(b.events) ? b.events : [];

    const updateEvent = (index: number, patch: Partial<EventListItem>) => {
        const newEvents = [...events];
        newEvents[index] = { ...newEvents[index], ...patch };
        onUpdate({ ...block, events: newEvents });
    };

    const addEvent = () => {
        onUpdate({
            ...block,
            events: [
                ...events,
                { id: self.crypto.randomUUID(), title: 'Nouvel événement', startDate: new Date().toISOString().split('T')[0] }
            ]
        });
    };

    const removeEvent = (index: number) => {
        onUpdate({ ...block, events: events.filter((_, i) => i !== index) });
    };

    if (tab === 'content') {
        return (
            <InspectorSection title="Agenda" defaultOpen>
                <div className="space-y-4">
                    {events.map((evt, i) => (
                        <div key={evt.id || i} className="border border-gray-200 rounded p-3 bg-white relative">
                            <button onClick={() => removeEvent(i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500">
                                <TrashIcon size={16} />
                            </button>
                            <label className="block text-xs font-semibold mb-1 text-slate-900">Titre</label>
                            <input type="text" value={evt.title || ''} onChange={e => updateEvent(i, { title: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />

                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-900">Début</label>
                                    <input type="date" value={evt.startDate || ''} onChange={e => updateEvent(i, { startDate: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-900">Fin</label>
                                    <input type="date" value={evt.endDate || ''} onChange={e => updateEvent(i, { endDate: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 text-sm" />
                                </div>
                            </div>

                            <label className="block text-xs font-semibold mb-1 text-slate-900">Lieu</label>
                            <input type="text" value={evt.location || ''} onChange={e => updateEvent(i, { location: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-2 text-sm" />

                            <label className="block text-xs font-semibold mb-1 text-slate-900">Description</label>
                            <textarea value={evt.description || ''} onChange={e => updateEvent(i, { description: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-2 text-sm" rows={2} />

                            <div className="flex gap-2">
                                <input type="text" placeholder="Lien (URL)" value={evt.linkUrl || ''} onChange={e => updateEvent(i, { linkUrl: e.target.value })} className="flex-1 p-2 border border-gray-200 rounded bg-white text-slate-900 text-sm" />
                                <input type="text" placeholder="Label bouton" value={evt.linkLabel || ''} onChange={e => updateEvent(i, { linkLabel: e.target.value })} className="flex-1 p-2 border border-gray-200 rounded bg-white text-slate-900 text-sm" />
                            </div>
                            <label className="flex items-center gap-2 mt-2 text-xs text-slate-900">
                                <input type="checkbox" checked={!!evt.highlight} onChange={e => updateEvent(i, { highlight: e.target.checked })} className="accent-indigo-600" />
                                Mettre en avant (Highlight)
                            </label>
                        </div>
                    ))}
                    <button onClick={addEvent} className="w-full py-2 border-2 border-dashed border-gray-200 rounded text-slate-500 hover:border-indigo-600 hover:text-indigo-600 flex items-center justify-center gap-2">
                        <PlusIcon size={16} /> Ajouter un événement
                    </button>
                </div>
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} />
                <InspectorSection title="Affichage" defaultOpen>
                    <label className="block text-sm font-medium mb-1 text-slate-900">Mise en page</label>
                    <select value={b.layout || 'list'} onChange={e => onUpdate({ ...block, layout: e.target.value as any })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-3">
                        <option value="list">Liste simple</option>
                        <option value="timeline">Chronologie (Timeline)</option>
                        <option value="cards">Cartes</option>
                    </select>

                    <label className="block text-sm font-medium mb-1 text-slate-900">Tri</label>
                    <select value={b.sortMode || 'manual'} onChange={e => onUpdate({ ...block, sortMode: e.target.value as any })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-3">
                        <option value="manual">Manuel (ordre de saisie)</option>
                        <option value="startDateAsc">Date croissante</option>
                        <option value="startDateDesc">Date décroissante</option>
                    </select>

                    <label className="block text-sm font-medium mb-1 text-slate-900">Titre de section</label>
                    <input type="text" value={b.heading || ''} placeholder="Ex: Prochaines expositions" onChange={e => onUpdate({ ...block, heading: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-3" />

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={b.showPastEvents !== false} onChange={e => onUpdate({ ...block, showPastEvents: e.target.checked })} className="accent-indigo-600" /> Afficher les événements passés</label>
                        <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={b.showDates !== false} onChange={e => onUpdate({ ...block, showDates: e.target.checked })} className="accent-indigo-600" /> Afficher les dates</label>
                        <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={b.showLocation !== false} onChange={e => onUpdate({ ...block, showLocation: e.target.checked })} className="accent-indigo-600" /> Afficher le lieu</label>
                        <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={b.showDescription !== false} onChange={e => onUpdate({ ...block, showDescription: e.target.checked })} className="accent-indigo-600" /> Afficher la description</label>
                        <label className="flex items-center gap-2 text-slate-900"><input type="checkbox" checked={!!b.condensed} onChange={e => onUpdate({ ...block, condensed: e.target.checked })} className="accent-indigo-600" /> Mode condensé</label>
                    </div>

                    <label className="block text-sm font-medium mt-3 mb-1 text-slate-900">Label badge "à venir"</label>
                    <input type="text" value={b.upcomingBadgeLabel || ''} placeholder="À venir" onChange={e => onUpdate({ ...block, upcomingBadgeLabel: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-3" />

                    <label className="block text-sm font-medium mt-3 mb-1 text-slate-900">Message si vide</label>
                    <input type="text" value={b.emptyStateMessage || ''} placeholder="Aucun événement à venir." onChange={e => onUpdate({ ...block, emptyStateMessage: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900" />
                </InspectorSection>
            </>
        );
    }

    if (tab === 'styles') {
        return (
            <>
                <InspectorSection title="Couleurs" defaultOpen>
                    <label className="block text-sm font-medium mb-1 text-slate-900">Couleur d'accentuation</label>
                    <input type="color" value={b.accentColor || '#3b82f6'} onChange={e => onUpdate({ ...block, accentColor: e.target.value })} className="w-full h-9 border-none bg-transparent" />
                </InspectorSection>
                <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />
            </>
        );
    }

    return null;
}
