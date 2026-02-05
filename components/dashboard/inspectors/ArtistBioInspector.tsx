import React, { useState } from 'react';
import { isArtistBioBlock, type ArtistBioBlock } from '@/types/cms';
import type { InspectorProps } from './types';
import InspectorSection from '../InspectorSection';
import TypographyControls from '../controls/TypographyControls';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import { AlignLeft as AlignLeftIcon, AlignCenter as AlignCenterIcon, AlignRight as AlignRightIcon } from 'lucide-react';

export function ArtistBioInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps<ArtistBioBlock>) {
    if (!isArtistBioBlock(block)) return null;
    const b = block;
    const [typoClipboard, setTypoClipboard] = useState<any>(null);

    if (tab === 'content') {
        return (
            <InspectorSection title="Biographie de l'artiste" defaultOpen>
                <div className="space-y-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <p className="text-sm text-indigo-700">
                            La biographie affichée est celle du profil de l'artiste.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">Alignement</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                            {[
                                { value: 'left', icon: <AlignLeftIcon size={16} />, label: 'Gauche' },
                                { value: 'center', icon: <AlignCenterIcon size={16} />, label: 'Centre' },
                                { value: 'right', icon: <AlignRightIcon size={16} />, label: 'Droite' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => onUpdate({ ...block, alignment: option.value as any })}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all text-sm ${(b.alignment || 'left') === option.value
                                        ? 'bg-white text-indigo-600 shadow-sm font-medium'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-gray-200/50'
                                        }`}
                                    title={option.label}
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
                <InspectorSection title="Typographie" defaultOpen help="Personnalisez le style de la biographie.">
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

