"use client";
import React from 'react';

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span
        className={
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors " +
          (disabled ? "bg-gray-200" : checked ? "bg-blue-600" : "bg-gray-300")
        }
        aria-hidden
      >
        <span
          className={
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform " +
            (checked ? "translate-x-4" : "translate-x-1")
          }
        />
      </span>
      {label && <span className={"select-none " + (disabled ? "text-gray-400" : "text-gray-800")}>{label}</span>}
    </label>
  );
}
