'use client';

import React, { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { THEME_PRESETS, getCategoryLabel, type ThemePreset } from '@/lib/cms/themePresets';
import type { ThemeConfig } from '@/types/cms';

interface ThemePresetPickerProps {
    currentPresetId?: string;
    onSelectPreset: (presetId: string, config: Partial<ThemeConfig>) => void;
}

/**
 * Theme preset picker component for quick theme selection.
 * Displays presets grouped by category with visual previews.
 */
export function ThemePresetPicker({ currentPresetId, onSelectPreset }: ThemePresetPickerProps) {
    const [expandedCategory, setExpandedCategory] = useState<string | null>('light');

    const categories: ThemePreset['category'][] = ['light', 'dark', 'artistic', 'minimal'];

    const handleSelect = (preset: ThemePreset) => {
        onSelectPreset(preset.id, preset.config);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Palette size={14} />
                <span>Presets de Thème</span>
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-3">
                {categories.map(category => {
                    const presets = THEME_PRESETS.filter(p => p.category === category);
                    const isExpanded = expandedCategory === category;

                    return (
                        <div key={category} className="flex flex-col gap-2">
                            {/* Category Header */}
                            <button
                                type="button"
                                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                                className="flex items-center justify-between px-2 py-1.5 rounded-lg 
                                           bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                            >
                                <span className="text-xs font-medium text-slate-600">
                                    {getCategoryLabel(category)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {presets.length} presets
                                </span>
                            </button>

                            {/* Preset Grid */}
                            {isExpanded && (
                                <div className="grid grid-cols-2 gap-2 pl-1">
                                    {presets.map(preset => (
                                        <PresetCard
                                            key={preset.id}
                                            preset={preset}
                                            isSelected={currentPresetId === preset.id}
                                            onSelect={() => handleSelect(preset)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Current selection info */}
            {currentPresetId && (
                <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-100">
                    Preset actif : <span className="font-medium text-slate-700">
                        {THEME_PRESETS.find(p => p.id === currentPresetId)?.name || currentPresetId}
                    </span>
                </div>
            )}
        </div>
    );
}

interface PresetCardProps {
    preset: ThemePreset;
    isSelected: boolean;
    onSelect: () => void;
}

function PresetCard({ preset, isSelected, onSelect }: PresetCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`
                relative flex flex-col gap-1.5 p-2 rounded-lg border-2 transition-all
                ${isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900/20'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }
            `}
        >
            {/* Color Preview */}
            <div className="flex gap-1 h-6">
                <div
                    className="flex-1 rounded-sm"
                    style={{ backgroundColor: preset.preview.background }}
                />
                <div
                    className="w-4 rounded-sm"
                    style={{ backgroundColor: preset.preview.primary }}
                />
                <div
                    className="w-4 rounded-sm"
                    style={{ backgroundColor: preset.preview.secondary }}
                />
            </div>

            {/* Name */}
            <div className="text-[10px] font-medium text-slate-700 text-left truncate">
                {preset.name}
            </div>

            {/* Selected checkmark */}
            {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 rounded-full 
                                flex items-center justify-center">
                    <Check size={10} className="text-white" />
                </div>
            )}
        </button>
    );
}

export default ThemePresetPicker;
