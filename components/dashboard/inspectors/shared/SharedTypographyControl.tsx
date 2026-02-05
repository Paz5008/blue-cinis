/**
 * Shared typography control component for inspector panels.
 * Provides consistent typography editing across text-based blocks.
 *
 * @module SharedTypographyControl
 */
'use client';

import React from 'react';
import InspectorSection from '../../InspectorSection';
import { FONT_OPTIONS } from '@/lib/cms/fonts';

export interface TypographyValues {
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    color?: string;
}

export interface SharedTypographyControlProps {
    /** Current typography values */
    values: TypographyValues;
    /** Callback when typography changes */
    onChange: (values: TypographyValues) => void;
    /** Section title */
    title?: string;
    /** Whether section is open by default */
    defaultOpen?: boolean;
    /** Show color picker */
    showColor?: boolean;
}

const FONT_WEIGHTS = [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi-bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra-bold' },
] as const;

const TEXT_TRANSFORMS = [
    { value: 'none', label: 'Normal' },
    { value: 'uppercase', label: 'MAJUSCULES' },
    { value: 'lowercase', label: 'minuscules' },
    { value: 'capitalize', label: 'Capitalize' },
] as const;

/**
 * Shared typography control with font family, size, weight, etc.
 */
export function SharedTypographyControl({
    values,
    onChange,
    title = 'Typographie',
    defaultOpen = false,
    showColor = true,
}: SharedTypographyControlProps) {
    const handleChange = (key: keyof TypographyValues, value: string | undefined) => {
        onChange({ ...values, [key]: value });
    };

    return (
        <InspectorSection title={title} defaultOpen={defaultOpen}>
            <div className="space-y-3">
                {/* Font Family */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-slate-700">
                        Police
                    </label>
                    <select
                        value={values.fontFamily || ''}
                        onChange={(e) => handleChange('fontFamily', e.target.value || undefined)}
                        className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">Par défaut</option>
                        {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Font Size & Weight */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Taille
                        </label>
                        <input
                            type="text"
                            value={values.fontSize || ''}
                            onChange={(e) => handleChange('fontSize', e.target.value || undefined)}
                            placeholder="16px"
                            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Graisse
                        </label>
                        <select
                            value={values.fontWeight || ''}
                            onChange={(e) => handleChange('fontWeight', e.target.value || undefined)}
                            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Par défaut</option>
                            {FONT_WEIGHTS.map((weight) => (
                                <option key={weight.value} value={weight.value}>
                                    {weight.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Line Height & Letter Spacing */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Interligne
                        </label>
                        <input
                            type="text"
                            value={values.lineHeight || ''}
                            onChange={(e) => handleChange('lineHeight', e.target.value || undefined)}
                            placeholder="1.5"
                            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Espacement
                        </label>
                        <input
                            type="text"
                            value={values.letterSpacing || ''}
                            onChange={(e) => handleChange('letterSpacing', e.target.value || undefined)}
                            placeholder="0"
                            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Text Transform */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-slate-700">
                        Transformation
                    </label>
                    <select
                        value={values.textTransform || 'none'}
                        onChange={(e) => handleChange('textTransform', e.target.value as TypographyValues['textTransform'])}
                        className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                        {TEXT_TRANSFORMS.map((transform) => (
                            <option key={transform.value} value={transform.value}>
                                {transform.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Color */}
                {showColor && (
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Couleur texte
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={values.color || '#000000'}
                                onChange={(e) => handleChange('color', e.target.value)}
                                className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={values.color || ''}
                                onChange={(e) => handleChange('color', e.target.value || undefined)}
                                placeholder="inherit"
                                className="flex-1 p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                )}
            </div>
        </InspectorSection>
    );
}

export default SharedTypographyControl;
