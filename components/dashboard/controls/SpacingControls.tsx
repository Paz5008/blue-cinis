"use client";
import React, { useState, useEffect } from 'react';
import { Link2, Link2Off } from 'lucide-react';

export interface SpacingControlProps {
  label: string;
  values: { top: string; right: string; bottom: string; left: string };
  onChange: (values: { top: string; right: string; bottom: string; left: string }) => void;
}

const parseValue = (val: string) => {
  const match = val.match(/^([-\d.]+)(.*)$/);
  if (!match) return { num: 0, unit: 'px' };
  return { num: parseFloat(match[1]), unit: match[2] || 'px' };
};

export default function SpacingControl({ label, values, onChange }: SpacingControlProps) {
  const [isLinked, setIsLinked] = useState(false);
  const [unit, setUnit] = useState('px');

  // Determine common unit if possible
  useEffect(() => {
    const v = parseValue(values.top || '0px');
    setUnit(v.unit);
  }, []);

  const handleChange = (side: keyof typeof values, newVal: string) => {
    if (isLinked) {
      onChange({ top: newVal, right: newVal, bottom: newVal, left: newVal });
    } else {
      onChange({ ...values, [side]: newVal });
    }
  };

  const handleNumChange = (side: keyof typeof values, num: number) => {
    const newVal = `${num}${unit}`;
    handleChange(side, newVal);
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
  };

  const sides = [
    { key: 'top', label: 'Haut' },
    { key: 'right', label: 'Droite' },
    { key: 'bottom', label: 'Bas' },
    { key: 'left', label: 'Gauche' },
  ] as const;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-900">{label}</label>
        <div className="flex items-center gap-2">
          <select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="text-xs border-none bg-transparent text-slate-500 hover:text-slate-900 focus:ring-0 cursor-pointer text-right min-w-[3rem]"
          >
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="%">%</option>
          </select>
          <button
            type="button"
            onClick={() => setIsLinked(!isLinked)}
            className={`p-1 rounded transition-colors ${isLinked ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            title={isLinked ? "Délier les valeurs" : "Lier les valeurs"}
          >
            {isLinked ? <Link2 size={14} /> : <Link2Off size={14} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {sides.map(({ key, label: sideLabel }) => {
          const { num } = parseValue(values[key] || '0');
          return (
            <div key={key} className="relative group">
              <label className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] text-slate-500 uppercase tracking-wider group-focus-within:text-indigo-600">
                {sideLabel}
              </label>
              <input
                type="number"
                value={num}
                onChange={(e) => handleNumChange(key, parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-gray-200 bg-white px-2 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
