/**
 * Shared margin control component for inspector panels.
 * Provides consistent margin editing across all block types.
 *
 * @module SharedMarginControl
 */
'use client';

import React from 'react';
import InspectorSection from '../../InspectorSection';

export interface MarginValues {
    marginTop?: string | number;
    marginBottom?: string | number;
    marginLeft?: string | number;
    marginRight?: string | number;
}

export interface SharedMarginControlProps {
    /** Current margin values */
    values: MarginValues;
    /** Callback when margins change */
    onChange: (values: MarginValues) => void;
    /** Section title */
    title?: string;
    /** Whether section is open by default */
    defaultOpen?: boolean;
    /** Enable linked margins (all same value) */
    linkable?: boolean;
}

/**
 * Shared margin control with 4 inputs for top/right/bottom/left.
 * Supports linked mode where all margins update together.
 */
export function SharedMarginControl({
    values,
    onChange,
    title = 'Marges',
    defaultOpen = false,
    linkable = true,
}: SharedMarginControlProps) {
    const [linked, setLinked] = React.useState(false);

    const handleChange = (key: keyof MarginValues, value: string) => {
        const numValue = value === '' ? undefined : value;

        if (linked) {
            // Update all margins when linked
            onChange({
                marginTop: numValue,
                marginRight: numValue,
                marginBottom: numValue,
                marginLeft: numValue,
            });
        } else {
            onChange({ ...values, [key]: numValue });
        }
    };

    const getValue = (key: keyof MarginValues): string => {
        const val = values[key];
        if (val === undefined || val === null) return '';
        return String(val);
    };

    return (
        <InspectorSection title={title} defaultOpen={defaultOpen}>
            <div className="space-y-3">
                {linkable && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                            type="checkbox"
                            checked={linked}
                            onChange={(e) => setLinked(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-600">Lier toutes les marges</span>
                    </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Haut
                        </label>
                        <input
                            type="text"
                            value={getValue('marginTop')}
                            onChange={(e) => handleChange('marginTop', e.target.value)}
                            placeholder="0"
                            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Bas
                        </label>
                        <input
                            type="text"
                            value={getValue('marginBottom')}
                            onChange={(e) => handleChange('marginBottom', e.target.value)}
                            placeholder="0"
                            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Gauche
                        </label>
                        <input
                            type="text"
                            value={getValue('marginLeft')}
                            onChange={(e) => handleChange('marginLeft', e.target.value)}
                            placeholder="0"
                            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-slate-700">
                            Droite
                        </label>
                        <input
                            type="text"
                            value={getValue('marginRight')}
                            onChange={(e) => handleChange('marginRight', e.target.value)}
                            placeholder="0"
                            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-500">
                    Valeurs en px ou % (ex: 16px, 2rem, 10%)
                </p>
            </div>
        </InspectorSection>
    );
}

export default SharedMarginControl;
