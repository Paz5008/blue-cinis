'use client';

import React from 'react';
// import ThemeInspector from './ThemeInspector';
import type { ThemeConfig, Block, CanvasSettings } from '../../types/cms';

interface Props {
  initialConfig: ThemeConfig & {
    blocks?: Block[];
    meta?: {
      title?: string | null;
      description?: string | null;
      canonicalUrl?: string | null;
    };
    settings?: CanvasSettings;
    artistName?: string | null;
    artist?: {
      id: string;
      name: string;
      slug?: string | null;
      photoUrl?: string | null;
      biography?: string | null;
      artworks?: { id: string; title?: string | null; imageUrl?: string | null }[];
    } | null;
  };
}

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#1e3a8a',
  secondaryColor: '#4f46e5',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  headingFont: 'var(--font-display, "DM Sans", sans-serif)',
  bodyFont: 'var(--font-body, "Inter", sans-serif)',
  layout: 'default',
};

export default function CustomizationForm({ initialConfig }: Props) {
  // Placeholder to fix build error (ThemeInspector missing)
  return (
    <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded">
      Composant de personnalisation temporairement indisponible.
    </div>
  );
}

