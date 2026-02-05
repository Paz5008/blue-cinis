import React from 'react';
import type { Block } from '@/types/cms';
import InspectorSection from '../../InspectorSection';
import { Monitor as MonitorIcon, Smartphone as SmartphoneIcon } from 'lucide-react';

interface CommonSettingsProps {
    block: Block;
    onUpdate: (block: Block) => void;
    withGeometry?: boolean;
    skipDimensions?: boolean;
}

export function CommonSettings({ block, onUpdate, withGeometry = true, skipDimensions = false }: CommonSettingsProps) {
    return (
        <>
            {withGeometry && (
                <InspectorSection title="Géométrie (Antigravity)" defaultOpen help="Positionnement absolu et effets (Mode Canvas seulement).">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label className="block text-xs font-medium mb-1 text-slate-700">X (%)</label>
                            <input type="number" value={block.x || 0} onChange={e => onUpdate({ ...block, x: Number(e.target.value) })} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1 text-slate-700">Y (px)</label>
                            <input type="number" value={block.y || 0} onChange={e => onUpdate({ ...block, y: Number(e.target.value) })} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        {!skipDimensions && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-slate-700">Largeur (%)</label>
                                    <input type="number" value={typeof block.width === 'number' ? block.width : parseFloat(String(block.width)) || ''} placeholder="Auto" onChange={e => onUpdate({ ...block, width: e.target.value ? Number(e.target.value) : undefined })} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-slate-700">Hauteur (px)</label>
                                    <input type="text" value={(block as any).height || ''} placeholder="Auto" onChange={e => onUpdate({ ...block, height: e.target.value } as any)} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-slate-700">Rotation (°)</label>
                            <input type="number" value={block.rotation || 0} onChange={e => onUpdate({ ...block, rotation: Number(e.target.value) })} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1 text-slate-700">Calque (Z)</label>
                            <input type="number" value={block.zIndex || 1} onChange={e => onUpdate({ ...block, zIndex: Number(e.target.value) })} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer bg-gray-50 p-2 rounded border border-gray-200 hover:bg-white transition-colors">
                        <input type="checkbox" checked={!!block.noise} onChange={e => onUpdate({ ...block, noise: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 bg-white border-gray-300" />
                        <span className="text-sm text-slate-700">Effet Flottant (Parallax)</span>
                    </label>
                </InspectorSection>
            )}
        </>
    );
}
