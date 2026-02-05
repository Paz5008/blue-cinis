
import React from 'react';
import type { ThemeConfig } from '@/types/cms';
import InspectorSection from './InspectorSection';
import MediaPickerControl from './controls/MediaPickerControl';
import NumberSliderInput from './controls/NumberSliderInput';
import { ThemePresetPicker } from './controls/ThemePresetPicker';

interface ThemeInspectorProps {
    theme: ThemeConfig;
    onChangeTheme: (theme: ThemeConfig) => void;
    onClose?: () => void;
    setMediaPicker: (options: { onSelect: (url: string) => void }) => void;
    [key: string]: any;
}

export default function ThemeInspector({ theme, onChangeTheme, setMediaPicker }: ThemeInspectorProps) {
    const updateTheme = (patch: Partial<ThemeConfig>) => {
        onChangeTheme({ ...theme, ...patch });
    };

    return (
        <>
            {/* Theme Presets Section */}
            <InspectorSection title="Démarrer avec un preset" defaultOpen>
                <ThemePresetPicker
                    currentPresetId={theme.stylePresetId}
                    onSelectPreset={(presetId, config) => {
                        onChangeTheme({ ...theme, ...config, stylePresetId: presetId });
                    }}
                />
            </InspectorSection>

            <InspectorSection title="Disposition & Ambiance" defaultOpen>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-700">Type de Layout</label>
                        <select
                            value={theme.layout || 'default'}
                            onChange={(e) => updateTheme({ layout: e.target.value as any })}
                            className="w-full p-2 border border-gray-200 bg-white rounded text-xs text-slate-900 focus:outline-none focus:border-black"
                        >
                            <option value="default">Défaut (Haut de page)</option>
                            <option value="modern">Moderne (Bandeau large)</option>
                            <option value="minimal">Minimal (Épuré)</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-700">Ton général</label>
                        <div className="flex rounded-md shadow-sm border border-slate-200 overflow-hidden">
                            {[
                                { id: 'light', label: 'Clair' },
                                { id: 'dark', label: 'Sombre' },
                                { id: 'contrast', label: 'Contraste' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => updateTheme({ tone: opt.id as any })}
                                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${(theme.tone || 'light') === opt.id
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </InspectorSection>

            <InspectorSection title="Arrière-plan Global" defaultOpen>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-700">Couleur de fond</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={theme.backgroundColor || '#ffffff'}
                                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                                className="h-8 w-8 rounded border-0 p-0 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={theme.backgroundColor || '#ffffff'}
                                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                                className="flex-1 p-2 border border-slate-200 rounded text-xs"
                                placeholder="#FFFFFF"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <MediaPickerControl
                            label="Image de fond"
                            value={theme.backgroundImageUrl}
                            onChange={(url) => updateTheme({ backgroundImageUrl: url })}
                            previewHeight={100}
                        />
                        {theme.backgroundImageUrl && (
                            <label className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    checked={theme.backgroundParallax || false}
                                    onChange={(e) => updateTheme({ backgroundParallax: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <span className="text-xs text-slate-700">Activer l'effet Parallax (Profondeur)</span>
                            </label>
                        )}
                    </div>
                </div>
            </InspectorSection>

            <InspectorSection title="Effets & Textures">
                <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-700">Grain / Bruit</span>
                            <span className="text-[10px] text-slate-500">Ajoute une texture "papier" subtile</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={theme.noiseTexture || false}
                            onChange={(e) => updateTheme({ noiseTexture: e.target.checked })}
                            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-semibold text-slate-700">Effet cadre sombre</label>
                        </div>
                        <span className="text-[10px] text-slate-500 -mt-1">Assombrit progressivement les bords de l'écran</span>
                        <NumberSliderInput
                            value={theme.vignetteStrength || 0}
                            onChange={(v) => updateTheme({ vignetteStrength: v })}
                            min={0}
                            max={100}
                            step={5}
                            unit="%"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-700">Flou d'arrière-plan</label>
                        <NumberSliderInput
                            value={theme.blurIntensity || 0}
                            onChange={(v) => updateTheme({ blurIntensity: v })}
                            min={0}
                            max={20}
                            step={1}
                            unit="px"
                        />
                    </div>

                    {theme.backgroundImageUrl && (
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-700">Désaturation (N&B)</label>
                            <NumberSliderInput
                                value={theme.backgroundDesaturation || 0}
                                onChange={(v) => updateTheme({ backgroundDesaturation: v })}
                                min={0}
                                max={100}
                                step={10}
                                unit="%"
                            />
                        </div>
                    )}
                </div>
            </InspectorSection>

            <InspectorSection title="Overlay (Superposition)">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-700">Couleur du filtre</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={(theme.overlayColor as string) || '#000000'}
                                onChange={(e) => updateTheme({ overlayColor: e.target.value })}
                                className="h-8 w-8 rounded border-0 p-0 cursor-pointer"
                            />
                            <span className="text-xs text-slate-500">Appliqué par dessus l'image</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-700">Opacité</label>
                        <NumberSliderInput
                            value={theme.overlayOpacity ? theme.overlayOpacity * 100 : 0}
                            onChange={(v) => updateTheme({ overlayOpacity: v / 100 })}
                            min={0}
                            max={90}
                            step={5}
                            unit="%"
                        />
                    </div>
                </div>
            </InspectorSection>
        </>
    );
}
