/**
 * Shared border control component for inspector panels.
 * Provides consistent border editing across all block types.
 *
 * @module SharedBorderControl
 */
'use client';

import React from 'react';
import InspectorSection from '../../InspectorSection';

export interface BorderValues {
    borderRadius?: string | number;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
    borderColor?: string;
    borderWidth?: string | number;
}

export interface SharedBorderControlProps {
    /** Current border values */
    values: BorderValues;
    /** Callback when borders change */
    onChange: (values: BorderValues) => void;
    /** Section title */
    title?: string;
    /** Whether section is open by default */
    defaultOpen?: boolean;
}

const BORDER_STYLES = [
    { value: 'none', label: 'Aucune' },
    { value: 'solid', label: 'Solide' },
    { value: 'dashed', label: 'Tirets' },
    { value: 'dotted', label: 'Points' },
] as const;

/**
 * Shared border control with inputs for radius, style, color, and width.
 */
export function SharedBorderControl({
    values,
    onChange,
    title = 'Bordure',
    defaultOpen = false,
}: SharedBorderControlProps) {
    const handleChange = (key: keyof BorderValues, value: string | number | undefined) => {
        onChange({ ...values, [key]: value });
    };

    return (
        <InspectorSection title={title} defaultOpen={defaultOpen}>
            <div className="space-y-3">
                {/* Border Style */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-slate-700">
                        Style
                    </label>
                    <select
                        value={values.borderStyle || 'none'}
                        onChange={(e) => handleChange('borderStyle', e.target.value as BorderValues['borderStyle'])}
                        className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                        {BORDER_STYLES.map((style) => (
                            <option key={style.value} value={style.value}>
                                {style.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Show other fields only if border style is not 'none' */}
                {values.borderStyle && values.borderStyle !== 'none' && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-slate-700">
                                    Épaisseur
                                </label>
                                <input
                                    type="text"
                                    value={values.borderWidth || ''}
                                    onChange={(e) => handleChange('borderWidth', e.target.value || undefined)}
                                    placeholder="1px"
                                    className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-slate-700">
                                    Rayon
                                </label>
                                <input
                                    type="text"
                                    value={values.borderRadius || ''}
                                    onChange={(e) => handleChange('borderRadius', e.target.value || undefined)}
                                    placeholder="0"
                                    className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1 text-slate-700">
                                Couleur
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={values.borderColor || '#000000'}
                                    onChange={(e) => handleChange('borderColor', e.target.value)}
                                    className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={values.borderColor || ''}
                                    onChange={(e) => handleChange('borderColor', e.target.value || undefined)}
                                    placeholder="#000000"
                                    className="flex-1 p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </InspectorSection>
    );
}

export default SharedBorderControl;
