import React from 'react';
import type { Block, ContactFormBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import type { InspectorProps } from './types';

export function ContactFormInspector({ block: genericBlock, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps) {
    // Type assertion: we know this inspector is only used with ContactFormBlock
    const block = genericBlock as ContactFormBlock;
    if (tab === 'content') {
        return (
            <>
                <InspectorSection title="Apparence du formulaire" defaultOpen>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-700">Style visuel</label>
                            <div className="flex rounded-md shadow-sm border border-slate-200 overflow-hidden">
                                {[
                                    { id: 'default', label: 'Défaut' },
                                    { id: 'minimal', label: 'Minimal' },
                                    { id: 'boxed', label: 'Carte' },
                                    { id: 'floating', label: 'Flottant' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => onUpdate({ ...block, variant: opt.id as any })}
                                        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${(block.variant || 'default') === opt.id
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-700">Texte du bouton</label>
                            <input
                                type="text"
                                value={block.submitLabel || ''}
                                placeholder="Envoyer le message"
                                onChange={(e) => onUpdate({ ...block, submitLabel: e.target.value })}
                                className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700">Champ Sujet</label>
                            <input
                                type="checkbox"
                                checked={block.showSubject !== false} // Default true
                                onChange={(e) => onUpdate({ ...block, showSubject: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 outline-none focus:ring-slate-900"
                            />
                        </div>
                    </div>
                </InspectorSection>

                <InspectorSection title="Information">
                    <div className="text-sm text-slate-500">
                        Ce formulaire enverra les messages à l'adresse email configurée dans votre profil artiste.
                    </div>
                </InspectorSection>
            </>
        );
    }

    if (tab === 'settings') return <CommonSettings block={block} onUpdate={onUpdate} />;
    if (tab === 'styles') return <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />;

    return null;
}
