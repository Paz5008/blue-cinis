"use client";
import React, { useEffect, useRef, useState } from 'react';
import { ColorControl } from './ColorControl';

type Props = {
  b: any; // current block (text/artistName/artistBio)
  onUpdate: (patch: any) => void; // merges into block (top-level)
  clipboard: any;
  setClipboard: (data: any) => void;
};

const TypographyControls: React.FC<Props> = ({ b, onUpdate, clipboard, setClipboard }) => {
  const useDebounced = (delay = 200) => {
    const t = useRef<ReturnType<typeof setTimeout> | null>(null);
    return (cb: () => void) => { if (t.current) clearTimeout(t.current); t.current = setTimeout(cb, delay); };
  };
  const debounced = useDebounced(200);
  const dftDesktop = parseInt((b.fontSize || ((b?.type === 'artistName') ? '32px' : '16px')).toString().replace('px', '') || '16', 10);
  const [desktop, setDesktop] = useState<number>(dftDesktop);

  useEffect(() => {
    const nd = parseInt((b.fontSize || ((b?.type === 'artistName') ? '32px' : '16px')).toString().replace('px', '') || '16', 10);
    setDesktop(nd);
  }, [b?.fontSize]);

  const defaultAlign = b?.type === 'artistBio' ? 'left' : 'center';
  return (
    <div className="text-slate-900">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-1 text-slate-700">Police</label>
          <select value={b.fontFamily || ''} onChange={e => onUpdate({ fontFamily: e.target.value })} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
            <option value="">Par défaut</option>
            <option value="Playfair Display">Playfair Display</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Inter">Inter</option>
            <option value="Poppins">Poppins</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lora">Lora</option>
            <option value="Merriweather">Merriweather</option>
            <option value="Raleway">Raleway</option>
            <option value="Source Sans 3">Source Sans 3</option>
            <option value="Nunito">Nunito</option>
            <option value="Oswald">Oswald</option>
            <option value="PT Serif">PT Serif</option>
            <option value="Libre Baskerville">Libre Baskerville</option>
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans-serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-700">Poids</label>
          <select value={b.fontWeight || ''} onChange={e => onUpdate({ fontWeight: e.target.value })} className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
            <option value="">Par défaut</option>
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semibold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">ExtraBold (800)</option>
          </select>
        </div>
      </div>
      <label className="block text-sm font-medium mt-2 mb-1 text-slate-700">Alignement</label>
      <select value={b.alignment || defaultAlign} onChange={e => onUpdate({ alignment: e.target.value })} className="w-full p-2 border border-gray-200 bg-white rounded mb-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
        <option value="left">Gauche</option>
        <option value="center">Centre</option>
        <option value="right">Droite</option>
      </select>
      <div className="space-y-2 mt-2">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Taille (px)</label>
          <input
            type="number"
            value={desktop}
            onChange={e => {
              const v = parseInt(e.target.value || '0', 10) || 0;
              setDesktop(v);
              debounced(() => onUpdate({ fontSize: `${v}px` }));
            }}
            className="w-full p-2 border border-gray-200 bg-white rounded text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      <label className="block text-sm font-medium mt-3 mb-1 text-slate-700">Couleur</label>
      <ColorControl
        color={b.color || '#000000'}
        onChange={val => onUpdate({ color: val })}
        allowAlpha={true}
      />

      <details className="group">
        <summary className="cursor-pointer list-none text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors py-2 flex items-center gap-1 select-none">
          <span className="group-open:rotate-90 transition-transform">▸</span> Plus d'options
        </summary>
        <div className="pt-2 pl-2 border-l-2 border-gray-100 ml-1 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 text-slate-500">Interligne</label>
              <input type="text" placeholder="ex: 1.6" value={b.lineHeight || ''} onChange={e => onUpdate({ lineHeight: e.target.value })} className="w-full p-1.5 border border-gray-200 bg-white rounded text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-slate-500">Esp. lettres</label>
              <input type="text" placeholder="ex: 0.5px" value={b.letterSpacing || ''} onChange={e => onUpdate({ letterSpacing: e.target.value })} className="w-full p-1.5 border border-gray-200 bg-white rounded text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-500">Transform.</label>
            <select value={b.textTransform || 'none'} onChange={e => onUpdate({ textTransform: e.target.value })} className="w-full p-1.5 border border-gray-200 bg-white rounded text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="none">Aucune</option>
              <option value="uppercase">MAJUSCULES</option>
              <option value="lowercase">minuscules</option>
              <option value="capitalize">Capitaliser</option>
            </select>
          </div>

          <div className="space-y-2 pt-1 border-t border-dashed border-gray-200">
            <div className="flex flex-wrap gap-2 text-[10px]">
              {/* Presets removed in favor of centralized PresetGallery */}
              <button type="button" className="px-2 py-1 border border-gray-200 text-slate-600 rounded hover:bg-gray-50 hover:text-slate-900" onClick={() => onUpdate({ lineHeight: undefined, letterSpacing: undefined, fontWeight: undefined })}>Reset</button>
            </div>
            <div className="flex items-center gap-2 text-[10px] pt-1">
              <button type="button" className="text-slate-400 hover:text-indigo-600 underline decoration-dotted" onClick={() => {
                const pick = ((obj: any, keys: string[]) => keys.reduce((acc: any, k) => { if (obj[k] !== undefined) acc[k] = obj[k]; return acc; }, {}));
                const data = pick(b, ['fontFamily', 'fontWeight', 'fontSize', 'fontSizeResp', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'alignment']);
                setClipboard(data);
              }}>Copier style</button>
              <button type="button" className="text-slate-400 hover:text-indigo-600 underline decoration-dotted disabled:opacity-50" disabled={!clipboard} onClick={() => { if (!clipboard) return; onUpdate({ ...clipboard }); }}>Coller</button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};

export default TypographyControls;
