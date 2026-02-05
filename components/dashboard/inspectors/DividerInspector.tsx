import React from 'react';
import type { Block, DividerBlock } from '@/types/cms';
import { isDividerBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import { ColorControl } from '../controls/ColorControl';
import type { InspectorProps } from './types';
import NumberSliderInput from '../controls/NumberSliderInput';
import EnumSegmented from '../controls/EnumSegmented';

export function DividerInspector({ block, onUpdate, tab, setMediaPicker, pageKey }: InspectorProps) {
    if (!isDividerBlock(block)) return null;
    const b = block;

    if (tab === 'content') {
        return (
            <InspectorSection title="Apparence du diviseur" defaultOpen>
                <div className="space-y-6">
                    <ColorControl
                        label="Couleur"
                        color={b.color || '#94a3b8'}
                        onChange={(val) => onUpdate({ ...b, color: val })}
                    />

                    <div>
                        <div className="mb-1 text-sm font-medium text-slate-900">Épaisseur</div>
                        <NumberSliderInput
                            value={b.thickness || 1}
                            onChange={(val) => onUpdate({ ...b, thickness: val })}
                            min={1}
                            max={20}
                            step={1}
                            unit="px"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">Style</label>
                        <EnumSegmented
                            value={b.borderStyle || 'solid'}
                            options={['solid', 'dashed', 'dotted']}
                            onChange={(val) => onUpdate({ ...b, borderStyle: val as any })}
                        />
                    </div>
                </div>
            </InspectorSection>
        );
    }

    if (tab === 'settings') return <CommonSettings block={block} onUpdate={onUpdate} />;
    if (tab === 'styles') return <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />;

    return null;
}
