import React, { useState, useEffect } from 'react';

interface ColorControlProps {
  label?: string;
  color: string;
  onChange: (color: string) => void;
  allowAlpha?: boolean;
}

const THEME_COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
];

export function ColorControl({ label, color, onChange, allowAlpha = true }: ColorControlProps) {
  // Local state for the text input to allow typing without jitter
  const [textValue, setTextValue] = useState(color);

  useEffect(() => {
    setTextValue(color);
  }, [color]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    // Basic validation: if it looks like a color or variable, emmit change
    // We'll trust the user or let browser validation handle strict hex/rgb later if needed.
    // For standard hex/rgba, just passing through is often enough.
    // We could debounce this if needed, but direct update is usually fine for color strings.
    onChange(val);
  };

  return (
    <div className="mb-3">
      {label && <label className="block text-sm font-medium mb-1 text-slate-900">{label}</label>}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-10 h-10 rounded border border-gray-200 shadow-sm overflow-hidden shrink-0">
          <input
            type="color"
            value={color.startsWith('#') && color.length === 7 ? color : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer opacity-0"
            title="Sélecteur système"
          />
          <div
            className="w-full h-full"
            style={{ backgroundColor: color }}
          />
        </div>
        <input
          type="text"
          value={textValue}
          onChange={handleTextChange}
          className="flex-1 p-2 text-sm border border-gray-200 rounded bg-white text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
          placeholder="#RRGGBB"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {THEME_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={`w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${color === c.value ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
              }`}
            style={{ backgroundColor: c.value }}
            title={c.name}
          />
        ))}
      </div>
      {allowAlpha && (
        <p className="text-[10px] text-slate-400 mt-1">
          Supporte Hex, RGB, RGBA ou noms CSS.
        </p>
      )}
    </div>
  );
}
