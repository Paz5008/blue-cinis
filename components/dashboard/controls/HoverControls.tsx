"use client";
import React, { useState } from 'react';
import ColorWithAlpha from './ColorWithAlpha';

type BoxShadow = { inset?: boolean; x: number; y: number; blur: number; spread: number; color: string };

type Props = {
  style: any;
  setStyle: (patch: Record<string, any>) => void;
  parseBoxShadow: (s: string) => BoxShadow;
  formatBoxShadow: (o: BoxShadow) => string;
};

const HoverControls: React.FC<Props> = ({ style, setStyle, parseBoxShadow, formatBoxShadow }) => {
  const [shadowOpen, setShadowOpen] = useState(false);
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Opacité (0–1)</label>
          <input type="range" min={0} max={1} step={0.01} value={typeof style?.hoverOpacity === 'number' ? Math.max(0, Math.min(1, style?.hoverOpacity as number)) : 1}
            onChange={e => setStyle({ hoverOpacity: Math.max(0, Math.min(1, parseFloat(e.target.value||'1')||1)) })}
            className="w-full" />
          <button type="button" className="mt-1 text-xs px-2 py-0.5 border rounded" onClick={() => setStyle({ hoverOpacity: 1 })}>Reset</button>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Échelle (scale)</label>
          <input type="range" min={0.5} max={2} step={0.01} value={typeof style?.hoverScale === 'number' ? (style?.hoverScale as number) : 1}
            onChange={e => setStyle({ hoverScale: parseFloat(e.target.value||'1')||1 })}
            className="w-full" />
          <button type="button" className="mt-1 text-xs px-2 py-0.5 border rounded" onClick={() => setStyle({ hoverScale: 1 })}>Reset</button>
        </div>
      </div>
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Ombre au survol</label>
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={typeof style?.hoverShadow === 'string' && style?.hoverShadow !== ''}
              onChange={e => setStyle({ hoverShadow: e.target.checked ? (style?.hoverShadow && style?.hoverShadow !== '' ? style?.hoverShadow : '0 8px 16px rgba(0,0,0,0.15)') : '' })} /> Activer
          </label>
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setShadowOpen(true)}>Configurer…</button>
        </div>
        {shadowOpen && (() => {
          const curr = parseBoxShadow((style?.hoverShadow) || '0 8px 16px rgba(0,0,0,0.15)');
          const update = (patch: Partial<BoxShadow>) => {
            const base = parseBoxShadow((style?.hoverShadow) || '0 8px 16px rgba(0,0,0,0.15)');
            const n = { ...base, ...patch } as BoxShadow;
            setStyle({ hoverShadow: formatBoxShadow(n) });
          };
          return (
            <div className="p-3 border rounded bg-white shadow relative z-10">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={parseBoxShadow((style?.hoverShadow) || '0 8px 16px rgba(0,0,0,0.15)').inset} onChange={e => update({ inset: e.target.checked })} />Inset</label>
                <ColorWithAlpha label="Couleur" value={curr.color} onChange={(rgba) => update({ color: rgba })} />
                <div><label className="block">Décalage X</label><input type="number" value={curr.x} onChange={e => update({ x: parseInt(e.target.value||'0',10)||0 })} className="w-full p-1 border rounded" /></div>
                <div><label className="block">Décalage Y</label><input type="number" value={curr.y} onChange={e => update({ y: parseInt(e.target.value||'0',10)||0 })} className="w-full p-1 border rounded" /></div>
                <div><label className="block">Flou</label><input type="number" value={curr.blur} onChange={e => update({ blur: parseInt(e.target.value||'0',10)||0 })} className="w-full p-1 border rounded" /></div>
                <div><label className="block">Étendue</label><input type="number" value={curr.spread} onChange={e => update({ spread: parseInt(e.target.value||'0',10)||0 })} className="w-full p-1 border rounded" /></div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => { setStyle({ hoverShadow: '' }); setShadowOpen(false); }}>Désactiver</button>
                <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setShadowOpen(false)}>Fermer</button>
              </div>
            </div>
          );
        })()}
      </div>
      <div className="mt-3">
        <label className="block text-sm font-medium mb-1">Durée transition (ms)</label>
        <input type="number" min={0} value={parseInt(String(style?.hoverTransitionMs ?? 200), 10)} onChange={e => {
          const v = Math.max(0, parseInt(e.target.value || '0', 10) || 0);
          setStyle({ hoverTransitionMs: v });
        }} className="w-full p-2 border rounded" />
        <button type="button" className="mt-1 text-xs px-2 py-0.5 border rounded" onClick={() => setStyle({ hoverTransitionMs: 200 })}>Reset</button>
      </div>
      <div className="mt-3">
        <div className="text-sm font-medium mb-1">Presets d'effets</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" className="px-2 py-1 border rounded" onClick={() => setStyle({ hoverOpacity: 0.95, hoverScale: 1, hoverShadow: '0 4px 10px rgba(0,0,0,0.10)', hoverTransitionMs: 200 })}>Subtil</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={() => setStyle({ hoverOpacity: 1, hoverScale: 1.03, hoverShadow: '0 8px 20px rgba(0,0,0,0.15)', hoverTransitionMs: 250 })}>Élevé</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={() => setStyle({ hoverOpacity: 1, hoverScale: 1.05, hoverShadow: '0 10px 24px rgba(0,0,0,0.18)', hoverTransitionMs: 300 })}>Flottant</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={() => setStyle({ hoverOpacity: 1, hoverScale: 1, hoverShadow: '', hoverTransitionMs: 200 })}>Aucun</button>
        </div>
      </div>
    </>
  );
};

export default HoverControls;
