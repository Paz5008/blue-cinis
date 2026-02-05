"use client";
import React, { useId, useState } from 'react';

interface NumberSliderInputProps {
  value?: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export default function NumberSliderInput({ value, onChange, min, max, step = 1, unit }: NumberSliderInputProps) {
  const id = useId();
  const [internal, setInternal] = useState<string>(value === undefined || value === null ? '' : String(value));

  const commit = (raw: string) => {
    const n = Number(raw);
    if (!Number.isNaN(n)) onChange(n);
  };

  return (
    <div className="flex items-center gap-2">
      {min !== undefined && max !== undefined && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={typeof value === 'number' ? value : min}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-labelledby={id}
          className="flex-1"
        />
      )}
      <div className="flex items-center gap-1 w-24">
        <input
          id={id}
          type="number"
          className="w-20 p-1 border rounded text-sm"
          value={internal}
          step={step}
          min={min}
          max={max}
          onChange={(e) => setInternal(e.target.value)}
          onBlur={() => commit(internal)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}
