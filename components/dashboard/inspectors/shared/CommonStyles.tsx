import React, { useState, useMemo } from 'react';
import type { Block, BlockStyle } from '@/types/cms';
import InspectorSection from '../../InspectorSection';
import BoxModelControl from '../../controls/BoxModelControl';
import GeneratedStyleControls from '../../controls/GeneratedStyleControls';
import BoxShadowControl from '../../controls/BoxShadowControl';
import { PresetGallery } from '../../controls/PresetGallery';
import { TextPresets, ImagePresets, ButtonPresets } from '@/lib/presets';
import { SharedBorderControl } from './SharedBorderControl';
import { SharedMarginControl } from './SharedMarginControl';

interface CommonStylesProps {
    block: Block;
    onUpdate: (block: Block) => void;
    setMediaPicker: (options: { onSelect: (url: string) => void }) => void;
    resetBlockStyles?: () => void;
    pageKey?: string;
}

export function CommonStyles({ block, onUpdate, setMediaPicker, resetBlockStyles, pageKey }: CommonStylesProps) {
    const style = block.style || {};

    const setStyle = (patch: Record<string, any>) => {
        onUpdate({ ...block, style: { ...style, ...patch } });
    };

    // --- Presets Logic ---
    const relevantPresets = useMemo(() => {
        switch (block.type) {
            case 'text':
            case 'artistName':
                return TextPresets;
            case 'image':
            case 'artistPhoto':
                return ImagePresets;
            case 'button':
                return ButtonPresets;
            case 'columns':
                return []; // Could add ColumnsPresets later
            default:
                return [];
        }
    }, [block.type]);

    const [lastStyleBeforePreset, setLastStyleBeforePreset] = useState<BlockStyle | null>(null);

    const handlePresetSelect = (presetStyle: Partial<BlockStyle>) => {
        setLastStyleBeforePreset({ ...style }); // Save current state
        setStyle(presetStyle);
    };

    const handleUndoPreset = () => {
        if (lastStyleBeforePreset) {
            onUpdate({ ...block, style: lastStyleBeforePreset });
            setLastStyleBeforePreset(null);
        }
    };
    // ---------------------

    const styleGapRaw = (style.gap ?? '').toString();
    const gapMatch = styleGapRaw.match(/^\s*(\d+)\s*(px)?\s*$/i);
    const gapSliderValue = gapMatch ? Math.max(0, Math.min(96, parseInt(gapMatch[1], 10))) : 0;
    const gapPresets = ['0px', '12px', '24px', '36px', '48px', '64px'];

    return (
        <>
            {/* Presets Gallery - Show if we have relevant presets */}
            {relevantPresets.length > 0 && (
                <InspectorSection
                    title="Styles Prédéfinis"
                    defaultOpen={true}
                    help="Appliquez un style rapide pour commencer."
                >
                    <PresetGallery
                        presets={relevantPresets}
                        onSelect={handlePresetSelect}
                    />
                    {lastStyleBeforePreset && (
                        <div className="mt-2 text-right">
                            <button
                                type="button"
                                onClick={handleUndoPreset}
                                className="text-xs text-slate-500 hover:text-indigo-600 underline decoration-dotted"
                            >
                                ↺ Annuler le changement de style
                            </button>
                        </div>
                    )}
                </InspectorSection>
            )}

            {resetBlockStyles && (
                <div className="mb-3 px-1">
                    <button
                        type="button"
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Réinitialiser tous les styles de ce bloc"
                        onClick={resetBlockStyles}
                    >
                        Réinitialiser tout le style
                    </button>
                </div>
            )}

            {/* Groupe Apparence */}
            <InspectorSection title="Apparence" defaultOpen={false} help="Couleurs, Image de fond, Bordures et Ombres.">
                {/* Gap Control */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Espacement interne (gap)</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={0}
                            max={96}
                            step={4}
                            value={gapSliderValue}
                            onChange={e => setStyle({ gap: `${e.target.value}px` })}
                            className="flex-1 accent-indigo-600"
                        />
                        <span className="text-xs font-mono text-slate-500 w-12 text-right">{styleGapRaw || '0px'}</span>
                    </div>
                </div>

                {/* Border & Radius - Hidden for Divider which has its own controls */}
                {block.type !== 'divider' && (
                    <SharedBorderControl
                        values={{
                            borderRadius: (style.borderRadius || '').toString(),
                            borderStyle: (style.borderStyle as any) || 'none',
                            borderColor: (style.borderColor || '').toString(),
                            borderWidth: (style.borderWidth || '').toString(),
                        }}
                        onChange={(vals) => {
                            const patch: Record<string, any> = {};
                            if (vals.borderRadius !== undefined) patch.borderRadius = vals.borderRadius;
                            if (vals.borderStyle !== undefined) patch.borderStyle = vals.borderStyle;
                            if (vals.borderColor !== undefined) patch.borderColor = vals.borderColor;
                            if (vals.borderWidth !== undefined) patch.borderWidth = vals.borderWidth;
                            // Also set combined border for CSS compatibility
                            if (vals.borderStyle && vals.borderStyle !== 'none') {
                                patch.border = `${vals.borderWidth || '1px'} ${vals.borderStyle} ${vals.borderColor || '#000'}`;
                            } else {
                                patch.border = undefined;
                            }
                            setStyle(patch);
                        }}
                        title="Bordure"
                        defaultOpen={false}
                    />
                )}

                {/* Background */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Image de fond</label>
                    {style.backgroundImageUrl && <img src={style.backgroundImageUrl} alt="Fond" className="w-full h-20 object-cover rounded mb-2 border border-gray-200" />}
                    <div className="flex gap-2">
                        <button type="button" className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:opacity-90 transition-opacity" onClick={() => setMediaPicker({ onSelect: url => setStyle({ backgroundImageUrl: url }) })}>Choisir</button>
                        {style.backgroundImageUrl && (
                            <button type="button" className="px-3 py-1 bg-gray-100 text-slate-700 rounded text-xs hover:bg-gray-200 transition-colors" onClick={() => setStyle({ backgroundImageUrl: undefined })}>Retirer</button>
                        )}
                        <label className="flex items-center gap-2 text-slate-700 text-xs ml-auto"><input type="checkbox" checked={!!style.parallax} onChange={e => setStyle({ parallax: e.target.checked })} className="rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500" /> Parallax</label>
                    </div>
                </div>

                {/* Shadow */}
                <div className="mb-4">
                    <BoxShadowControl
                        value={style.boxShadow}
                        onChange={(val) => setStyle({ boxShadow: val })}
                    />
                </div>
            </InspectorSection>

            {/* Autres styles générés */}
            <GeneratedStyleControls
                block={block}
                style={style}
                onStyleChange={setStyle}
                skipKeys={['typography', 'textAlign']} // Skip typography/textAlign as they are handled by dedicated controls
            />

            {/* Groupe Padding Only (Moved to bottom) */}
            <InspectorSection title="Espacement interne (Padding)" defaultOpen={false} help="Ajustez l'espacement interne (padding) du bloc.">
                <BoxModelControl
                    label="Padding"
                    padding={(() => {
                        const p = style.padding || '0';
                        const parts = p.toString().trim().split(/\s+/);
                        let top = parts[0] || '0';
                        let right = parts[1] || top;
                        let bottom = parts[2] || top;
                        let left = parts[3] || right;
                        if (parts.length === 3) left = parts[1];
                        return { top, right, bottom, left };
                    })()}
                    onChangePadding={(vals) => setStyle({
                        padding: `${vals.top} ${vals.right} ${vals.bottom} ${vals.left}`
                    })}
                />
            </InspectorSection>

            {/* Marges externes */}
            <SharedMarginControl
                values={{
                    marginTop: (style.marginTop || '').toString(),
                    marginBottom: (style.marginBottom || '').toString(),
                    marginLeft: (style.marginLeft || '').toString(),
                    marginRight: (style.marginRight || '').toString(),
                }}
                onChange={(vals) => {
                    const patch: Record<string, any> = {};
                    if (vals.marginTop !== undefined) patch.marginTop = vals.marginTop;
                    if (vals.marginBottom !== undefined) patch.marginBottom = vals.marginBottom;
                    if (vals.marginLeft !== undefined) patch.marginLeft = vals.marginLeft;
                    if (vals.marginRight !== undefined) patch.marginRight = vals.marginRight;
                    setStyle(patch);
                }}
                title="Marges externes"
                defaultOpen={false}
            />
        </>
    );
}
