"use client";
import React from 'react';

interface EnumSegmentedProps {
  value?: string;
  options: string[];
  onChange: (v: string) => void;
  ariaLabel?: string;
  labels?: Record<string, string>;
}

export default function EnumSegmented({ value, options, onChange, ariaLabel, labels }: EnumSegmentedProps) {
  return (
    <div className="inline-flex rounded border border-gray-300 overflow-hidden" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={
              "px-2 py-1 text-xs " +
              (active ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50 text-gray-800") +
              " border-r last:border-r-0 border-gray-300"
            }
            aria-pressed={active}
          >
            {labels?.[opt] || opt}
          </button>
        );
      })}
    </div>
  );
}
