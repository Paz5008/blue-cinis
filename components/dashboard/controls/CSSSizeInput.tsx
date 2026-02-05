"use client";
import React, { useEffect, useMemo, useState } from 'react';

interface CSSSizeInputProps {
  value?: string;
  onChange: (v?: string) => void;
  presets?: string[]; // e.g., ['0','4px','8px','12px','16px','24px']
}

const DEFAULT_PRESETS = ['0', '4px', '8px', '12px', '16px', '24px', '32px'];

function splitSize(v?: string): { num: string; unit: string } {
  if (!v) return { num: '', unit: 'px' };
  const m = String(v).trim().match(/^(\d+(?:\.\d+)?)(px|rem|%|vh|vw)?$/i);
  if (!m) return { num: String(v), unit: '' };
  return { num: m[1], unit: (m[2] || 'px') };
}

export default function CSSSizeInput({ value, onChange, presets = DEFAULT_PRESETS }: CSSSizeInputProps) {
  const [{ num, unit }, setState] = useState(splitSize(value));

  useEffect(() => { setState(splitSize(value)); }, [value]);

  const setNum = (n: string) => {
    setState((s) => ({ ...s, num: n }));
    const v = n === '' ? undefined : n + (unit || '');
    onChange(v as any);
  };
  const setUnit = (u: string) => {
    setState((s) => ({ ...s, unit: u }));
    const v = num === '' ? undefined : num + u;
    onChange(v as any);
  };

  const units = useMemo(() => ['px', 'rem', '%'], []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-24 p-1 border rounded text-sm"
          value={num}
          onChange={(e) => setNum(e.target.value)}
        />
        <div className="inline-flex rounded border overflow-hidden">
          {units.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={"px-2 py-1 text-xs border-r last:border-r-0 " + (unit === u ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50')}
            >
              {u}
            </button>
          ))}
        </div>
        {value && (
          <button type="button" className="text-xs text-gray-600 underline" onClick={() => onChange(undefined)}>Effacer</button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {(presets || []).map((p) => (
          <button key={p} type="button" onClick={() => onChange(p)} className="px-2 py-0.5 text-xs border rounded hover:bg-gray-50">
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
