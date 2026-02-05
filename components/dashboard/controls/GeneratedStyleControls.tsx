import React, { useMemo, useState } from 'react';
import type { Block } from '@/types/cms';
import { getGroupedStyleParamDescriptorsForBlock, type StyleParamDescriptor } from '@/lib/inspector/registry';
import InspectorSection from '../InspectorSection';
import { Monitor, Smartphone } from 'lucide-react';
import { StyleAccordionGroup } from './StyleAccordionGroup';
import SpacingControl from './SpacingControls';
import { ColorControl } from './ColorControl';

const DEFAULT_SKIP_KEYS = new Set([
  'backgroundColor',
  'borderRadius',
  'border',
  'backgroundImageUrl',
  'parallax',
  'boxShadow',
  'gap',
  // 'padding', // Allow padding/margins to be handled by SpacingControl
  // 'marginTop',
  // 'marginBottom',
  // 'marginLeft',
  // 'marginRight',
]);

const STYLE_HINTS: Record<string, string> = {
  backgroundImageUrl: 'Utilisez une image en https://…',
  backgroundSize: 'Ex: cover | contain | 120%',
  backgroundPosition: 'Ex: center | 50% 30%',
  backgroundRepeat: 'Ex: no-repeat',
  gradientFrom: 'Ex: #00000000 (transparent)',
  gradientTo: 'Ex: #000000',
  gradientDirection: 'Ex: to bottom | 45deg',
  overlayOpacity: '0 à 1 (ex: 0.45)',
  hoverOpacity: '0 à 1 (ex: 0.8)',
  hoverScale: 'Ex: 1.05 pour zoom léger',
  hoverShadow: 'Ex: 0 24px 48px rgba(15,23,42,0.25)',
  hoverTransitionMs: 'Durée en ms (ex: 200)',
  widthResp: 'Ex: 80%',
  'widthResp.desktop': 'Ex: 80%',
  'widthResp.mobile': 'Ex: 100%',
  canvasAlign: 'Gauche, centre ou droite',
  overlayColor: 'Ex: rgba(0,0,0,0.4)',
  blendMode: 'Ex: multiply | overlay',
  marginTop: 'Ex: 24px',
  marginBottom: 'Ex: 24px',
  marginLeft: 'Ex: 24px',
  marginRight: 'Ex: 24px',
  padding: 'Ex: 32px 24px',
};

type Props = {
  block: Block;
  style: Record<string, any> | undefined;
  onStyleChange: (patch: Record<string, any>) => void;
  skipKeys?: string[];
  device?: 'desktop' | 'mobile';
};

const humanize = (input: string): string =>
  input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([_-])/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const getNestedValue = (obj: any, parts: string[]) =>
  parts.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);

const buildPatch = (style: any, parts: string[], value: any): Record<string, any> => {
  const [head, ...rest] = parts;
  if (!head) return {};
  if (rest.length === 0) {
    return { [head]: value };
  }
  const current =
    style && typeof style === 'object' && style[head] && typeof style[head] === 'object'
      ? style[head]
      : {};
  return {
    [head]: {
      ...current,
      ...buildPatch(current, rest, value),
    },
  };
};

const parseSliderControl = (control: string) => {
  const match = control.match(/slider\+number\(([-\d.]+)\.\.([-\d.]+),([-\d.]+)\)/);
  if (!match) return null;
  const [, min, max, step] = match;
  return {
    min: Number.parseFloat(min),
    max: Number.parseFloat(max),
    step: Number.parseFloat(step),
  };
};

const getEnumOptions = (type: string): string[] | null => {
  const match = type.match(/^enum<(.+)>$/);
  if (!match) return null;
  return match[1]
    .split('|')
    .map((item) => item.replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
};

const shouldSkip = (styleKey: string, skipSet: Set<string>) => {
  const [head] = styleKey.split('.');
  return skipSet.has(head);
};

const formatValue = (value: unknown): string | number => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

const parsePaddingShorthand = (val: string) => {
  // Basic parsing for 1, 2, 3, 4 values
  const parts = val.toString().trim().split(/\s+/);
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  if (parts.length === 4) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
  return { top: '', right: '', bottom: '', left: '' };
};

const GeneratedStyleControls: React.FC<Props> = ({ block, style, onStyleChange, skipKeys, device = 'desktop' }) => {
  const groupedDescriptors = useMemo(
    () => getGroupedStyleParamDescriptorsForBlock(block.type),
    [block.type],
  );

  const skipSet = useMemo(() => {
    const set = new Set(DEFAULT_SKIP_KEYS);
    (skipKeys || []).forEach((key) => set.add(key));
    // Explicitly allow margins so we can process them if needed (though we removed margin controls elsewhere, keeping logic safe)
    set.delete('marginTop'); set.delete('marginRight'); set.delete('marginBottom'); set.delete('marginLeft');
    // Ensure padding is SKIPPED because it's handled by BoxModelControl in CommonStyles
    set.add('padding');
    return set;
  }, [skipKeys]);

  // Initial filtering
  const filteredGroups = useMemo(() => {
    const result: Record<string, StyleParamDescriptor[]> = {};
    Object.keys(groupedDescriptors).forEach(groupName => {
      const descriptors = groupedDescriptors[groupName].filter(d => !shouldSkip(d.styleKey, skipSet));
      if (descriptors.length > 0) {
        result[groupName] = descriptors;
      }
    });
    return result;
  }, [groupedDescriptors, skipSet]);

  // Post-process groups to consolidate margins/padding
  const processedGroups = useMemo(() => {
    const result: Record<string, StyleParamDescriptor[]> = {};
    Object.keys(filteredGroups).forEach(groupName => {
      const original = filteredGroups[groupName];
      const margins = original.filter(d => ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].includes(d.styleKey));
      const paddings = original.filter(d => d.styleKey === 'padding');

      let newDescriptors = [...original];

      if (margins.length > 0) {
        // Remove all margin props
        newDescriptors = newDescriptors.filter(d => !['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].includes(d.styleKey));
        // Add virtual 'margin' descriptor
        newDescriptors.unshift({
          BlockType: block.type,
          ParameterPath: 'style.margin',
          Type: 'spacing',
          styleParts: ['margin'],
          styleKey: 'margin'
        });
      }

      if (paddings.length > 0) {
        newDescriptors = newDescriptors.filter(d => d.styleKey !== 'padding');
        newDescriptors.unshift({
          BlockType: block.type,
          ParameterPath: 'style.padding',
          Type: 'spacing',
          styleParts: ['padding'],
          styleKey: 'padding'
        });
      }

      if (newDescriptors.length > 0) {
        result[groupName] = newDescriptors;
      }
    });
    return result;
  }, [filteredGroups, block.type]);

  const activeSummary = useMemo(() => {
    if (!style) return [];
    const lines: string[] = [];
    Object.values(processedGroups).flat().forEach((descriptor) => {
      // Handle virtual keys
      if (descriptor.styleKey === 'margin') {
        // Optional: summarize margin
        return;
      }
      if (descriptor.styleKey === 'padding') {
        return;
      }

      const value = getNestedValue(style, descriptor.styleParts);
      if (value === undefined || value === null || value === '') return;
      if (typeof value === 'object') return;
      const label = humanize(descriptor.styleParts[descriptor.styleParts.length - 1]);
      lines.push(`${label}: ${value}`);
    });
    return lines.slice(0, 4);
  }, [processedGroups, style]);

  const applyValue = (parts: string[], value: any) => {
    const patch = buildPatch(style || {}, parts, value);
    onStyleChange(patch);
  };

  const renderControl = (descriptor: StyleParamDescriptor) => {
    const { styleParts, styleKey, SuggestedControl = '', Type } = descriptor;

    if (styleKey === 'margin') {
      const values = {
        top: style?.marginTop || '0px',
        right: style?.marginRight || '0px',
        bottom: style?.marginBottom || '0px',
        left: style?.marginLeft || '0px'
      };
      return (
        <SpacingControl
          key="margin-control"
          label="Marges"
          values={values}
          onChange={(newValues) => {
            onStyleChange({
              marginTop: newValues.top,
              marginRight: newValues.right,
              marginBottom: newValues.bottom,
              marginLeft: newValues.left
            });
          }}
        />
      );
    }

    if (styleKey === 'padding') {
      const raw = style?.padding || '0px';
      const parsed = parsePaddingShorthand(raw);
      return (
        <SpacingControl
          key="padding-control"
          label="Espacement interne (Padding)"
          values={parsed}
          onChange={(newValues) => {
            const shorthand = `${newValues.top} ${newValues.right} ${newValues.bottom} ${newValues.left}`;
            onStyleChange({ padding: shorthand });
          }}
        />
      );
    }

    const current = getNestedValue(style, styleParts);
    const label = humanize(styleParts[styleParts.length - 1]);
    const enumOptions = getEnumOptions(Type);
    const slider = parseSliderControl(SuggestedControl);
    const isColorControl = SuggestedControl?.toLowerCase().includes('color') || /color/i.test(styleKey);
    const joinedKey = styleParts.join('.');
    const hint =
      STYLE_HINTS[styleKey] ||
      STYLE_HINTS[joinedKey] ||
      (styleParts.includes('widthResp') ? (device === 'mobile' ? 'Largeur sur mobile (ex: 100%)' : 'Largeur sur bureau (ex: 80%)') : undefined);

    // Auto-labeling for Bimodal
    const showMobileIcon = device === 'mobile' && (styleKey === 'widthResp' || styleKey === 'width');
    const bimodalLabel = showMobileIcon ? `${label} (Mobile)` : label;

    if (enumOptions && enumOptions.length > 0) {
      return (
        <div key={descriptor.ParameterPath}>
          <label className="block text-sm font-medium mb-1 text-slate-900 flex items-center justify-between">
            {bimodalLabel}
            {showMobileIcon && <Smartphone size={14} className="text-indigo-600" />}
          </label>
          <select
            value={formatValue(current)}
            onChange={(e) => applyValue(styleParts, e.target.value || undefined)}
            className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Automatique</option>
            {enumOptions.map((option) => (
              <option key={option} value={option}>
                {humanize(option)}
              </option>
            ))}
          </select>
          {hint && <p className="mt-1 text-[11px] text-slate-500 opacity-80">{hint}</p>}
        </div>
      );
    }

    if ((Type === 'boolean' || SuggestedControl === 'toggle') && typeof current !== 'string') {
      return (
        <div key={descriptor.ParameterPath}>
          <label className="flex items-center gap-2 text-sm text-slate-900">
            <input
              type="checkbox"
              checked={Boolean(current)}
              onChange={(e) => applyValue(styleParts, e.target.checked)}
              className="rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
            />
            {label}
          </label>
          {hint && <p className="mt-1 text-[11px] text-slate-500 opacity-80">{hint}</p>}
        </div>
      );
    }

    if (slider) {
      return (
        <div key={descriptor.ParameterPath}>
          <label className="block text-sm font-medium mb-1 text-slate-900">{label}</label>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={Number.isFinite(Number(current)) ? Number(current) : slider.min}
            onChange={(e) => applyValue(styleParts, Number.parseFloat(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <input
            type="number"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={formatValue(current)}
            onChange={(e) => {
              const next = Number.parseFloat(e.target.value);
              applyValue(styleParts, Number.isFinite(next) ? next : undefined);
            }}
            className="mt-1 w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {hint && <p className="mt-1 text-[11px] text-slate-500 opacity-80">{hint}</p>}
        </div>
      );
    }

    if (isColorControl) {
      return (
        <ColorControl
          key={descriptor.ParameterPath}
          label={label}
          color={typeof current === 'string' ? current : ''}
          onChange={(val) => applyValue(styleParts, val)}
        />
      );
    }

    if (Type === 'number') {
      return (
        <div key={descriptor.ParameterPath}>
          <label className="block text-sm font-medium mb-1 text-slate-900">{label}</label>
          <input
            type="number"
            value={formatValue(current)}
            onChange={(e) => {
              const next = Number.parseFloat(e.target.value);
              applyValue(styleParts, Number.isFinite(next) ? next : undefined);
            }}
            className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {hint && <p className="mt-1 text-[11px] text-slate-500 opacity-80">{hint}</p>}
        </div>
      );
    }

    return (
      <div key={descriptor.ParameterPath}>
        <label className="block text-sm font-medium mb-1 text-slate-900 flex items-center justify-between">
          {bimodalLabel}
          {showMobileIcon && <Smartphone size={14} className="text-indigo-600" />}
        </label>
        <input
          type="text"
          value={formatValue(current)}
          onChange={(e) => applyValue(styleParts, e.target.value || undefined)}
          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder={hint || 'Valeur CSS'}
        />
        {hint && <p className="mt-1 text-[11px] text-slate-500 opacity-80">{hint}</p>}
      </div>
    );
  };

  if (Object.keys(processedGroups).length === 0) return null;

  return (
    <InspectorSection
      title="Réglages avancés"
      defaultOpen
      help="Paramètres additionnels groupés (apparence, mise en page, etc.)."
    >
      {activeSummary.length > 0 && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-slate-500">
          <p className="font-medium text-slate-900">Styles actifs (résumé)</p>
          <ul className="mt-1 space-y-0.5">
            {activeSummary.map((line, index) => (
              <li key={`${line}-${index}`} className="truncate">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      <StyleAccordionGroup
        groups={processedGroups}
        renderControl={renderControl}
        defaultOpenGroup={block.type === 'text' ? 'typography' : undefined}
      />
    </InspectorSection>
  );
};

export default GeneratedStyleControls;
