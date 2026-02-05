import React from 'react';
import type { Block } from '@/types/cms';
import InspectorSection from '../../InspectorSection';

interface FilterControlsProps {
    block: Block;
    onUpdate: (block: Block) => void;
}

export function FilterControls({ block, onUpdate }: FilterControlsProps) {
    const b = block as any;
    const f = typeof b.style?.filter === 'string' ? b.style.filter : '';

    const getVal = (n: string, def: number) => {
        const m = f.match(new RegExp(`${n}\\(([\\d\\.]+)%?\\)`));
        return m ? parseFloat(m[1]) : def;
    };

    const updateFilter = (n: string, v: number, unit = '%') => {
        const currentFilters = f.split(' ').filter((p: string) => p.trim() && !p.startsWith(n));
        if (v !== ((n === 'brightness' || n === 'contrast' || n === 'saturate') ? 100 : 0)) {
            currentFilters.push(`${n}(${v}${unit})`);
        }
        onUpdate({ ...block, style: { ...b.style, filter: currentFilters.join(' ') } } as Block);
    };

    return (
        <InspectorSection title="Filtres Image" defaultOpen help="Appliquez des filtres CSS pour styliser votre image.">
            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-900">
                        <span>Opacité</span>
                        <span>{Math.round((parseFloat(b.style?.opacity || '1')) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round((parseFloat(b.style?.opacity || '1')) * 100)}
                        onChange={e => onUpdate({ ...block, style: { ...b.style, opacity: (parseInt(e.target.value) / 100).toString() } } as Block)}
                        className="w-full accent-indigo-600"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-900"><span>Luminosité</span><span>{getVal('brightness', 100)}%</span></div>
                    <input type="range" min="0" max="200" value={getVal('brightness', 100)} onChange={e => updateFilter('brightness', parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-900"><span>Contraste</span><span>{getVal('contrast', 100)}%</span></div>
                    <input type="range" min="0" max="200" value={getVal('contrast', 100)} onChange={e => updateFilter('contrast', parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-900"><span>Saturation</span><span>{getVal('saturate', 100)}%</span></div>
                    <input type="range" min="0" max="200" value={getVal('saturate', 100)} onChange={e => updateFilter('saturate', parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-900"><span>Noir & Blanc</span><span>{getVal('grayscale', 0)}%</span></div>
                    <input type="range" min="0" max="100" value={getVal('grayscale', 0)} onChange={e => updateFilter('grayscale', parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-900"><span>Flou</span><span>{getVal('blur', 0)}px</span></div>
                    <input type="range" min="0" max="20" step="0.5" value={getVal('blur', 0)} onChange={e => updateFilter('blur', parseFloat(e.target.value), 'px')} className="w-full accent-indigo-600" />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-900"><span>Sépia</span><span>{getVal('sepia', 0)}%</span></div>
                    <input type="range" min="0" max="100" value={getVal('sepia', 0)} onChange={e => updateFilter('sepia', parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>
            </div>
        </InspectorSection>
    );
}
