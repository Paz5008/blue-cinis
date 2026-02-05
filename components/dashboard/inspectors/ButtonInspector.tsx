import React from 'react';
import { isButtonBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import { AlignLeft as AlignLeftIcon, AlignCenter as AlignCenterIcon, AlignRight as AlignRightIcon } from 'lucide-react';
import type { InspectorProps } from './types';

export function ButtonInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps) {
    if (!isButtonBlock(block)) return null;
    const b = block;

    if (tab === 'content') {
        return (
            <InspectorSection title="Bouton" defaultOpen>
                <label className="block text-sm font-medium mb-1 text-slate-900">Libellé</label>
                <input type="text" value={b.label} onChange={e => onUpdate({ ...block, label: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900 mb-2" />
                <label className="block text-sm font-medium mb-1 text-slate-900">URL</label>
                <input type="url" value={b.url} onChange={e => onUpdate({ ...block, url: e.target.value })} className="w-full p-2 border border-gray-200 rounded bg-white text-slate-900" placeholder="https://" pattern="https?://.*" />
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} skipDimensions={true} />
                <InspectorSection title="Alignement" defaultOpen help="Alignez le bouton dans sa ligne.">
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
            </>
        );
    }

    if (tab === 'styles') {
        return <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />;
    }

    return null;
}
