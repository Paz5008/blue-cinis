"use client";
import React from 'react';
import ColorWithAlpha from './ColorWithAlpha';

type Props = {
  style: any;
  setStyle: (patch: Record<string, any>) => void;
  onPickImage: (cb: (url: string) => void) => void;
};

const BackgroundControls: React.FC<Props> = ({ style, setStyle, onPickImage }) => {
  return (
    <>
      <div className="mt-2">
        <div className="text-sm font-medium mb-1">Motifs (patterns)</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" className="px-2 py-1 border rounded" onClick={() => {
            // Diagonal stripes pattern
            const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><defs><pattern id='s' patternUnits='userSpaceOnUse' width='24' height='24' patternTransform='rotate(45)'><rect width='24' height='24' fill='white'/><rect width='12' height='24' fill='rgba(0,0,0,0.03)'/></pattern></defs><rect width='100%' height='100%' fill='url(#s)'/></svg>`);
            setStyle({ backgroundImageUrl: `data:image/svg+xml,${svg}`, backgroundRepeat: 'repeat', backgroundSize: '24px 24px' });
          }}>Rayures</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={() => {
            // Dots pattern
            const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='3' cy='3' r='2' fill='rgba(0,0,0,0.08)'/></svg>`);
            setStyle({ backgroundImageUrl: `data:image/svg+xml,${svg}`, backgroundRepeat: 'repeat', backgroundSize: '20px 20px' });
          }}>Pois</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={() => {
            // Grid pattern
            const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M24 0H0v1h24V0zM0 24h1V0H0v24z' fill='rgba(0,0,0,0.06)'/></svg>`);
            setStyle({ backgroundImageUrl: `data:image/svg+xml,${svg}`, backgroundRepeat: 'repeat', backgroundSize: '24px 24px' });
          }}>Quadrillage</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={() => setStyle({ backgroundImageUrl: undefined })}>Aucun motif</button>
        </div>
      </div>
      <div className="mt-2">
        <div className="text-sm font-medium mb-1">Presets Overlay/Dégradé</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setStyle({ overlayColor: undefined, overlayOpacity: 0, gradientFrom: undefined, gradientTo: undefined, gradientMid: undefined })}>Aucun</button>
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setStyle({ overlayColor: '#000000', overlayOpacity: 0.4 })}>Overlay sombre</button>
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setStyle({ overlayColor: '#ffffff', overlayOpacity: 0.25 })}>Overlay clair</button>
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setStyle({ gradientType: 'linear', gradientDirection: 'to right', gradientFrom: '#ff7e5f', gradientTo: '#feb47b', gradientMid: undefined })}>Sunset</button>
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setStyle({ gradientType: 'linear', gradientDirection: 'to bottom', gradientFrom: '#00c6ff', gradientTo: '#0072ff', gradientMid: undefined })}>Ocean</button>
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setStyle({ gradientType: 'radial', gradientFrom: '#0f2027', gradientMid: '#203a43', gradientTo: '#2c5364' })}>Night</button>
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setStyle({ overlayColor: '#ffffff', overlayOpacity: 0.08 })}>Glass</button>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-sm font-medium mb-1">Overlay personnalisé</div>
        <ColorWithAlpha label="Couleur" value={style?.overlayColor || ''} onChange={(rgba) => setStyle({ overlayColor: rgba, overlayOpacity: undefined })} />
      </div>
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Mélange (blend-mode)</label>
        <select value={(style?.blendMode || 'normal').toString()} onChange={e => setStyle({ blendMode: e.target.value })} className="w-full p-2 border rounded">
          <option value="normal">normal</option>
          <option value="multiply">multiply</option>
          <option value="screen">screen</option>
          <option value="overlay">overlay</option>
          <option value="darken">darken</option>
          <option value="lighten">lighten</option>
          <option value="color-dodge">color-dodge</option>
          <option value="color-burn">color-burn</option>
          <option value="hard-light">hard-light</option>
          <option value="soft-light">soft-light</option>
          <option value="difference">difference</option>
          <option value="exclusion">exclusion</option>
          <option value="hue">hue</option>
          <option value="saturation">saturation</option>
          <option value="color">color</option>
          <option value="luminosity">luminosity</option>
        </select>
      </div>
      <div className="mt-3">
        <label className="block text-sm font-medium mb-1">Padding</label>
        <input type="text" value={(style?.padding || '').toString()} onChange={e => setStyle({ padding: e.target.value })} className="w-full p-2 border rounded mb-2" />
        <label className="block text-sm font-medium mb-1">Couleur de fond</label>
        <input type="color" value={(style?.backgroundColor || '#ffffff').toString()} onChange={e => setStyle({ backgroundColor: e.target.value })} className="w-full h-9 border-none mb-2" />
        <label className="block text-sm font-medium mb-1">Rayon de bordure</label>
        <input type="text" value={(style?.borderRadius || '0px').toString()} onChange={e => setStyle({ borderRadius: e.target.value })} className="w-full p-2 border rounded mb-2" />
        <label className="block text-sm font-medium mb-1">Image de fond</label>
        {style?.backgroundImageUrl && <img src={style?.backgroundImageUrl} alt="Fond" className="w-full h-20 object-cover rounded mb-2" />}
        <div className="flex gap-2 mb-2">
          <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => onPickImage((url) => setStyle({ backgroundImageUrl: url }))}>Choisir</button>
          {style?.backgroundImageUrl && (
            <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => setStyle({ backgroundImageUrl: undefined })}>Retirer</button>
          )}
        </div>
        {style?.backgroundImageUrl && (
          <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
            <div>
              <label className="block mb-1">Taille</label>
              <select value={(style?.backgroundSize || 'cover').toString()} onChange={e => setStyle({ backgroundSize: e.target.value === 'auto' ? undefined : e.target.value })} className="w-full p-2 border rounded">
                <option value="cover">cover</option>
                <option value="contain">contain</option>
                <option value="auto">auto</option>
                <option value="custom">custom…</option>
              </select>
              {(style?.backgroundSize === 'custom') && (
                <input type="text" placeholder="ex: 100% auto" value={(style?.backgroundSizeCustom||'')} onChange={e => setStyle({ backgroundSizeCustom: e.target.value })} className="mt-1 w-full p-1 border rounded" />
              )}
            </div>
            <div>
              <label className="block mb-1">Position</label>
              <select value={(style?.backgroundPosition || 'center').toString()} onChange={e => setStyle({ backgroundPosition: e.target.value === 'center' ? undefined : e.target.value })} className="w-full p-2 border rounded">
                <option value="center">center</option>
                <option value="top">top</option>
                <option value="bottom">bottom</option>
                <option value="left">left</option>
                <option value="right">right</option>
                <option value="top left">top left</option>
                <option value="top right">top right</option>
                <option value="bottom left">bottom left</option>
                <option value="bottom right">bottom right</option>
                <option value="custom">custom…</option>
              </select>
              {(style?.backgroundPosition === 'custom') && (
                <input type="text" placeholder="ex: 50% 30%" value={(style?.backgroundPositionCustom||'')} onChange={e => setStyle({ backgroundPositionCustom: e.target.value })} className="mt-1 w-full p-1 border rounded" />
              )}
            </div>
            <div>
              <label className="block mb-1">Répétition</label>
              <select value={(style?.backgroundRepeat || 'no-repeat').toString()} onChange={e => setStyle({ backgroundRepeat: e.target.value === 'no-repeat' ? undefined : e.target.value })} className="w-full p-2 border rounded">
                <option value="no-repeat">no-repeat</option>
                <option value="repeat">repeat</option>
                <option value="repeat-x">repeat-x</option>
                <option value="repeat-y">repeat-y</option>
              </select>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!style?.parallax} onChange={e => setStyle({ parallax: e.target.checked })} /> Effet parallax</label>
          <button type="button" className="ml-auto text-xs px-2 py-1 border rounded" onClick={() => setStyle({ backgroundSize: undefined, backgroundSizeCustom: undefined, backgroundPosition: undefined, backgroundPositionCustom: undefined, backgroundRepeat: undefined })}>Reset custom</button>
        </div>
      </div>
    </>
  );
};

export default BackgroundControls;
