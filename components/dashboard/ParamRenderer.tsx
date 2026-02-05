"use client";
import React, { useMemo } from 'react';
import Toggle from './controls/Toggle';
import EnumSegmented from './controls/EnumSegmented';
import NumberSliderInput from './controls/NumberSliderInput';
import { ColorControl } from './controls/ColorControl';
import MediaPickerControl from './controls/MediaPickerControl';
import InspectorSection from './InspectorSection';
import type { Block } from '../../types/cms';
import { useEditorI18n } from '../../context/EditorI18nContext';
import CSSSizeInput from './controls/CSSSizeInput';
import MultiEntityPicker, { EntityOption } from './controls/MultiEntityPicker';
import { normalizeCmsUrl, type NormalizeCmsUrlOptions } from '@/lib/url';

// Types of registry rows we generated
interface ParamRow {
  BlockType: string;
  ParameterPath: string;
  Type: string;
  Optional: boolean;
  SuggestedTab: 'content' | 'settings' | 'styles' | 'theme';
  SuggestedControl: string;
  VisibleIf?: { path: string; equals?: any; notEquals?: any; in?: any[] };
  Scope?: 'responsive' | 'variant' | 'base';
  Label?: string;
  Section?: string;
}

function deepGet(obj: any, path: string): any {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}
function deepSet(obj: any, path: string, value: any): any {
  const parts = path.split('.');
  const next = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur: any = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    cur[p] = typeof cur[p] === 'object' && cur[p] !== null ? { ...cur[p] } : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

function parseEnum(typeStr: string): string[] | null {
  const m = /^enum<([^>]+)>$/.exec(typeStr);
  if (!m) return null;
  return m[1].split('|').map((s) => s.trim());
}

const URL_SEGMENTS = new Set([
  'url',
  'src',
  'poster',
  'thumbnailUrl',
  'coverImageUrl',
  'backgroundImageUrl',
  'cardBackgroundImageUrl',
]);

const isUrlParameter = (path: string): boolean => {
  const segments = path.split('.');
  return segments.some((segment) => URL_SEGMENTS.has(segment));
};

const urlOptionsForPath = (path: string): NormalizeCmsUrlOptions => {
  if (/embed\.url$/i.test(path)) {
    return { allowRelative: false, allowMailto: false, allowData: false };
  }
  if (/button\.url$/i.test(path) || /linkUrl$/i.test(path)) {
    return { allowRelative: false };
  }
  if (/poster$/i.test(path)) {
    return { allowRelative: false };
  }
  return { allowRelative: true, allowData: true, allowMailto: true };
};

function isVisible(row: ParamRow, block: Block): boolean {
  const rule = (row as any).VisibleIf as ParamRow['VisibleIf'] | undefined;
  if (!rule) return true;
  const current = deepGet(block as any, rule.path);
  if (rule.equals !== undefined) return current === rule.equals;
  if (rule.notEquals !== undefined) return current !== rule.notEquals;
  if (rule.in) return rule.in.includes(current);
  return true;
}

function controlFor(
  row: ParamRow,
  value: any,
  setValue: (v: any) => void,
  opts?: { entityOptions?: { artworks?: EntityOption[] } }
): React.ReactNode {
  const t = row.Type;
  const ctrl = row.SuggestedControl;
  const enums = parseEnum(t);

  if (ctrl === 'toggle') return <Toggle checked={!!value} onChange={setValue} />;
  if (ctrl === 'color') return <ColorControl color={value} onChange={setValue} />;
  if (ctrl === 'media') return <MediaPickerControl value={value} onChange={setValue} />;
  if (ctrl === 'entity-multi') {
    // For artworks/selection
    const options = opts?.entityOptions?.artworks || [];
    return <MultiEntityPicker value={Array.isArray(value) ? value : []} onChange={setValue} options={options} />;
  }
  if (ctrl.startsWith('slider+number')) {
    let min: number | undefined;
    let max: number | undefined;
    let step: number | undefined;
    const mm = /\(([^)]*)\)/.exec(ctrl);
    if (mm && mm[1]) {
      const parts = mm[1].split(',');
      if (parts[0]) min = Number(parts[0]);
      if (parts[1]) max = Number(parts[1]);
      if (parts[2]) step = Number(parts[2]);
    }
    return <NumberSliderInput value={typeof value === 'number' ? value : undefined} onChange={setValue} min={min} max={max} step={step} />;
  }
  if (ctrl === 'number') return <NumberSliderInput value={typeof value === 'number' ? value : undefined} onChange={setValue} />;
  if (ctrl.startsWith('text (CSS)') || /(size|width|height|radius|padding|margin|gap)/i.test(row.ParameterPath)) {
    return <CSSSizeInput value={typeof value === 'string' ? value : undefined} onChange={setValue} />;
  }
  if (isUrlParameter(row.ParameterPath)) {
    const options = urlOptionsForPath(row.ParameterPath);
    const stringValue = typeof value === 'string' ? value : '';
    const normalized = normalizeCmsUrl(stringValue, options);
    const invalid = stringValue.trim().length > 0 && !normalized;
    return (
      <div className="space-y-1">
        <input
          type="url"
          className={`w-full rounded border px-2 py-1.5 text-sm ${invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`}
          value={stringValue}
          placeholder="https://…"
          onChange={(e) => {
            const raw = e.target.value;
            const next = normalizeCmsUrl(raw, options);
            const trimmed = raw.trim();
            setValue(next ?? (trimmed ? trimmed : undefined));
          }}
        />
        <p className="text-[11px] text-slate-500">Les liens http sont convertis automatiquement en https.</p>
        {invalid ? <p className="text-[11px] text-red-600">Format attendu : https://…</p> : null}
      </div>
    );
  }
  if (ctrl === 'segmented' && enums) return <EnumSegmented value={value} options={enums} onChange={setValue} />;
  if (ctrl === 'select' && enums) {
    return (
      <select className="p-2 border rounded text-sm" value={value || ''} onChange={(e) => setValue(e.target.value)}>
        <option value="" disabled>Choisir…</option>
        {enums.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  // Fallback text input
  return (
    <input
      type="text"
      className="w-full p-2 border rounded text-sm"
      value={value ?? ''}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

interface ParamRendererProps {
  block: Block;
  rows: ParamRow[];
  tab: 'content' | 'settings' | 'styles';
  onChange: (b: Block) => void;
  entityOptions?: { artworks?: EntityOption[] };
}

export default function ParamRenderer({ block, rows, tab, onChange, entityOptions }: ParamRendererProps) {
  const { lang } = useEditorI18n();
  const filtered = useMemo(() => rows.filter((r) => r.SuggestedTab === tab && isVisible(r as any, block)), [rows, tab, block]);

  const grouped = useMemo(() => {
    // Group by top-level section prefix (style.* → Apparence; query/selection → Données; default → Réglages)
    const groups: Record<string, ParamRow[]> = {};
    for (const r of filtered) {
      let key = (r as any).SectionI18n?.[lang] || r.Section || (lang === 'en' ? 'Settings' : 'Réglages');
      if (!r.Section) {
        if (r.ParameterPath.startsWith('style.')) key = 'Apparence';
        else if (r.ParameterPath.startsWith('query') || r.ParameterPath.startsWith('selection') || r.ParameterPath.startsWith('images') || r.ParameterPath.startsWith('artworks')) key = 'Données';
      }
      (groups[key] ||= []).push(r);
    }
    return groups;
  }, [filtered, lang]);

  const setParam = (path: string, v: any) => onChange(deepSet(block as any, path, v) as Block);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([section, items]) => (
        <InspectorSection key={section} title={`Auto • ${section}`} defaultOpen>
          <div className="space-y-3">
            {items.map((r) => {
              const val = deepGet(block as any, r.ParameterPath);
              return (
                <div key={r.ParameterPath} className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-xs text-gray-600 col-span-1 truncate" title={r.ParameterPath}>{(r as any).LabelI18n?.[lang] || r.Label || r.ParameterPath}</label>
                  <div className="col-span-2">
                    {controlFor(r as any, val, (nv) => setParam(r.ParameterPath, nv), { entityOptions })}
                  </div>
                </div>
              );
            })}
          </div>
        </InspectorSection>
      ))}
    </div>
  );
}
