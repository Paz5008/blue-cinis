import React from 'react';
import { isArtistPhotoBlock, type ArtistPhotoBlock } from '@/types/cms';
import type { InspectorProps } from './types';
import InspectorSection from '../InspectorSection';
import EnumSegmented from '../controls/EnumSegmented';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import { AlignLeft as AlignLeftIcon, AlignCenter as AlignCenterIcon, AlignRight as AlignRightIcon, Circle, Square, RectangleHorizontal } from 'lucide-react';

export function ArtistPhotoInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps<ArtistPhotoBlock>) {
    if (!isArtistPhotoBlock(block)) return null;
    const b = block;

    if (tab === 'content') {
        return (
            <InspectorSection title="Photo de l'artiste" defaultOpen>
                <div className="space-y-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <p className="text-sm text-indigo-700">
                            La photo affichée est celle du profil de l'artiste.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">Taille</label>
                        <EnumSegmented
                            value={b.size || 'medium'}
                            options={['small', 'medium', 'large', 'full']}
                            onChange={(val) => onUpdate({ ...block, size: val as any })}
                            labels={{ small: 'Petit', medium: 'Moyen', large: 'Grand', full: 'Plein' }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">Forme</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 gap-1">
                            {[
                                { value: 'square', icon: <Square size={16} />, label: 'Carré' },
                                { value: 'rounded', icon: <RectangleHorizontal size={16} />, label: 'Arrondi' },
                                { value: 'circle', icon: <Circle size={16} />, label: 'Cercle' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => onUpdate({ ...block, shapePreset: option.value as any })}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all text-sm gap-1 ${(b.shapePreset || 'square') === option.value
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
        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} skipDimensions={true} />
                <InspectorSection title="Rendu de l'image" defaultOpen>
                    <label className="block text-sm font-medium mb-2 text-slate-900">Ajustement</label>
                    <EnumSegmented
                        value={b.objectFit || 'cover'}
                        options={['cover', 'contain', 'fill']}
                        onChange={(val) => onUpdate({ ...block, objectFit: val as any })}
                        labels={{ cover: 'Couvrir', contain: 'Contenir', fill: 'Remplir' }}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Couvrir : remplit le cadre, peut rogner. Contenir : image entière visible.
                    </p>
                </InspectorSection>
            </>
        );
    }

    if (tab === 'styles') {
        return <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />;
    }

    return null;
}

