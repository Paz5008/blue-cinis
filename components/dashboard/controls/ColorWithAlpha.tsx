"use client";
import React from 'react';

type Props = {
  label?: string;
  value?: string; // accepts hex or rgba()
  onChange: (rgba: string) => void;
};

function hexToRgb(hex: string) {
  const h = (hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const bigint = parseInt(full || '000000', 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function parseColorAlpha(color?: string): { hex: string; alpha: number } {
  try {
    if (!color) return { hex: '#000000', alpha: 1 };
    if (/^rgba\(/i.test(color)) {
      const m = color.match(/rgba\(([^)]+)\)/i);
      if (m) {
        const parts = m[1].split(',').map(s => s.trim());
        const r = Math.max(0, Math.min(255, parseInt(parts[0] || '0', 10) || 0));
        const g = Math.max(0, Math.min(255, parseInt(parts[1] || '0', 10) || 0));
        const b = Math.max(0, Math.min(255, parseInt(parts[2] || '0', 10) || 0));
        const a = Math.max(0, Math.min(1, parseFloat(parts[3] || '1') || 1));
        const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
        return { hex, alpha: a };
      }
    }
    if (/^rgb\(/i.test(color)) {
      const m = color.match(/rgb\(([^)]+)\)/i);
      if (m) {
        const parts = m[1].split(',').map(s => s.trim());
        const r = Math.max(0, Math.min(255, parseInt(parts[0] || '0', 10) || 0));
        const g = Math.max(0, Math.min(255, parseInt(parts[1] || '0', 10) || 0));
        const b = Math.max(0, Math.min(255, parseInt(parts[2] || '0', 10) || 0));
        const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
        return { hex, alpha: 1 };
      }
    }
    const hex = color.startsWith('#') ? color : '#000000';
    return { hex, alpha: 1 };
  } catch {
    return { hex: '#000000', alpha: 1 };
  }
}

function composeRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex || '#000000');
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const ColorWithAlpha: React.FC<Props> = ({ label, value, onChange }) => {
  const { hex, alpha } = parseColorAlpha(value);
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm text-gray-700">{label}</span>}
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(composeRgba(e.target.value, alpha))}
        className="h-8 w-12 border rounded"
      />
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(alpha * 100)}
        onChange={(e) => onChange(composeRgba(hex, (parseInt(e.target.value || '0', 10) || 0) / 100))}
        className="flex-1"
      />
      <span className="text-xs text-gray-600 w-8 text-right">{Math.round(alpha * 100)}%</span>
    </div>
  );
};

export default ColorWithAlpha;
