import React, { useState } from 'react';
import { type ArtistNameBlock } from '@/types/cms';
import { TextInspector } from './TextInspector';
import type { InspectorProps } from './types';
import InspectorSection from '../InspectorSection';
import EnumSegmented from '../controls/EnumSegmented';
import TypographyControls from '../controls/TypographyControls';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import { AlignLeft as AlignLeftIcon, AlignCenter as AlignCenterIcon, AlignRight as AlignRightIcon } from 'lucide-react';

export function ArtistNameInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps<ArtistNameBlock>) {
    const b = block;
    const [typoClipboard, setTypoClipboard] = useState<any>(null);

    if (tab === 'content') {
        return (
            <InspectorSection title="Nom de l'artiste" defaultOpen>
                <div className="space-y-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <p className="text-sm text-indigo-700">
                            Le nom affiché est celui de l'artiste du profil.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">Balise HTML</label>
                        <EnumSegmented
                            value={b.tag || 'h1'}
                            options={['h1', 'h2', 'h3']}
                            onChange={(val) => onUpdate({ ...block, tag: val as any })}
                            labels={{ h1: 'H1', h2: 'H2', h3: 'H3' }}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Impact SEO : H1 pour le titre principal, H2/H3 pour les secondaires.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">Alignement</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                            {[
                                { value: 'left', icon: <AlignLeftIcon size={16} /> },
                                { value: 'center', icon: <AlignCenterIcon size={16} /> },
                                { value: 'right', icon: <AlignRightIcon size={16} /> },
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
                    </div>
                </div>
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return <CommonSettings block={block} onUpdate={onUpdate} />;
    }

    if (tab === 'styles') {
        return (
            <>
                <InspectorSection title="Typographie" defaultOpen help="Personnalisez le style du nom.">
                    <TypographyControls
                        b={block}
                        onUpdate={(patch) => onUpdate({ ...block, ...patch })}
                        clipboard={typoClipboard}
                        setClipboard={setTypoClipboard}
                    />
                </InspectorSection>
                <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />
            </>
        );
    }

    return null;
}

