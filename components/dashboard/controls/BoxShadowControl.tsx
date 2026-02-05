"use client";
import React, { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';

interface BoxShadowControlProps {
    value: string | undefined;
    onChange: (val: string | undefined) => void;
}

const PRESETS = [
    { label: 'Aucune', value: '', class: 'shadow-none' },
    { label: 'Douce', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', class: 'shadow-md' },
    { label: 'Moyenne', value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', class: 'shadow-xl' },
    { label: 'Forte', value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', class: 'shadow-2xl' },
];

export default function BoxShadowControl({ value, onChange }: BoxShadowControlProps) {
    const [mode, setMode] = useState<'preset' | 'manual'>('preset');

    // Detect if current value matches a preset
    useEffect(() => {
        const matchesPreset = PRESETS.some(p => p.value === (value || ''));
        if (!matchesPreset && value) {
            setMode('manual');
        } else {
            setMode('preset');
        }
    }, [value]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-900">Ombre (Shadow)</label>
                <button
                    type="button"
                    onClick={() => setMode(m => m === 'preset' ? 'manual' : 'preset')}
                    className={`p-1 rounded transition-colors ${mode === 'manual' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Basculer en mode manuel"
                >
                    <Settings2 size={14} />
                </button>
            </div>

            {mode === 'preset' ? (
                <div className="grid grid-cols-4 gap-2">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => onChange(preset.value || undefined)}
                            className={`group relative flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${(value || '') === preset.value
                                    ? 'border-indigo-600 bg-indigo-50/50'
                                    : 'border-transparent hover:bg-gray-50'
                                }`}
                        >
                            {/* Preview Box */}
                            <div className={`w-8 h-8 bg-white rounded border border-gray-100 ${preset.class} transition-shadow duration-300`} />

                            <span className={`text-[10px] font-medium ${(value || '') === preset.value ? 'text-indigo-600' : 'text-slate-500'}`}>
                                {preset.label}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="relative">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={e => onChange(e.target.value || undefined)}
                        className="w-full p-2 text-sm border border-gray-200 rounded bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                        placeholder="Ex: 0 10px 15px -3px rgba(0,0,0,0.1)"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                        Valeur CSS standard. <button type="button" onClick={() => onChange('')} className="underline hover:text-slate-800">Effacer</button>
                    </p>
                </div>
            )}
        </div>
    );
}
