import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Block, ThemeConfig } from '@/types/cms';

type BannerInsights = {
  totalClicks?: number;
  lastSevenDays?: number;
  lastClickAt?: string | null;
  topCtas?: Array<{
    ctaKey: string;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    clicks?: number;
    placement?: string | null;
    presetId?: string | null;
    lastClickAt?: string | null;
  }>;
} | null;

type ToastFn = (message: string, type?: 'success' | 'error' | 'info', duration?: number) => string;

interface UseBannerExperienceProps {
  isBanner: boolean;
  blocks: Block[];
  theme: ThemeConfig;
  applyThemeToHome: boolean;
  addToast?: ToastFn;
  initialBannerInsights: BannerInsights;
  bannerDesignHeight: number;
  bannerDesignWidth: number;
}

interface BannerCoachChecklistItem {
  key: string;
  label: string;
  ok: boolean;
  hint?: string;
  familyKey?: string;
}

interface BannerCoach {
  score: number;
  checklist: BannerCoachChecklistItem[];
  wordCount: number;
  buttonCount: number;
}

interface BannerCanvasDiagnostics {
  used: number;
  limit: number;
  ratioLabel: string;
  overflow: number;
  slack: number;
}

export function useBannerExperience({
  isBanner,
  blocks,
  theme,
  applyThemeToHome,
  addToast,
  initialBannerInsights,
  bannerDesignHeight,
  bannerDesignWidth,
}: UseBannerExperienceProps) {
  const bannerContentRef = useRef<HTMLDivElement | null>(null);
  const [bannerContentHeight, setBannerContentHeight] = useState(0);
  const [bannerInsights, setBannerInsights] = useState<BannerInsights>(initialBannerInsights ?? null);
  const [bannerInsightsLoading, setBannerInsightsLoading] = useState(false);
  const [showBannerGuides, setShowBannerGuides] = useState(() => !isBanner);

  const measureBannerContent = useCallback(() => {
    const node = bannerContentRef.current;
    if (!node) return;
    const next = Math.round(node.scrollHeight);
    setBannerContentHeight(prev => (Math.abs(prev - next) < 1 ? prev : next));
  }, []);

  useEffect(() => {
    if (!isBanner) {
      setBannerContentHeight(0);
      return;
    }
    measureBannerContent();
    let rafId = requestAnimationFrame(measureBannerContent);
    const target = bannerContentRef.current;
    if (!target || typeof ResizeObserver === 'undefined') {
      return () => cancelAnimationFrame(rafId);
    }
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measureBannerContent);
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [isBanner, measureBannerContent]);

  useEffect(() => {
    if (!isBanner) return;
    measureBannerContent();
  }, [isBanner, blocks, measureBannerContent]);

  useEffect(() => {
    if (isBanner) {
      setShowBannerGuides(false);
    }
  }, [isBanner]);

  const refreshBannerInsights = useCallback(async () => {
    if (!isBanner) return;
    try {
      setBannerInsightsLoading(true);
      const response = await fetch('/api/artist/banner/insights', { method: 'GET', cache: 'no-store' });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setBannerInsights(data);
    } catch {
      addToast?.("Impossible de mettre à jour les statistiques du bandeau", 'error');
    } finally {
      setBannerInsightsLoading(false);
    }
  }, [isBanner, addToast]);

  useEffect(() => {
    if (!isBanner) return;
    if (bannerInsights != null) return;
    refreshBannerInsights();
  }, [isBanner, bannerInsights, refreshBannerInsights]);

  const formatRelativeTime = useCallback((iso: string | null) => {
    if (!iso) return 'Jamais';
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return 'Jamais';
    const now = Date.now();
    const diffMs = date.getTime() - now;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
    if (Math.abs(diffMs) < hour) {
      return rtf.format(Math.round(diffMs / minute), 'minute');
    }
    if (Math.abs(diffMs) < day) {
      return rtf.format(Math.round(diffMs / hour), 'hour');
    }
    if (Math.abs(diffMs) < month) {
      return rtf.format(Math.round(diffMs / day), 'day');
    }
    return rtf.format(Math.round(diffMs / month), 'month');
  }, []);

  const bannerCoach: BannerCoach | null = useMemo(() => {
    if (!isBanner) return null;
    const flattened: any[] = [];
    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return;
      flattened.push(node);
      if (Array.isArray(node.children)) node.children.forEach(visit);
      if (Array.isArray(node.columns)) node.columns.forEach((col: any[]) => {
        if (Array.isArray(col)) col.forEach(visit);
      });
      if (Array.isArray(node.items)) node.items.forEach(visit);
    };
    blocks.forEach(visit);

    const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const textBlocks = flattened.filter(block => typeof block?.content === 'string' && block.content.trim().length > 0);
    const wordCount = textBlocks.reduce((sum, block) => sum + stripHtml(block.content).split(/\s+/).filter(Boolean).length, 0);
    const hasHeading = textBlocks.some(block => /<h[1-3]\b/i.test(block.content));
    const buttonCount = flattened.reduce((sum, block) => {
      if (!block) return sum;
      if (block.type === 'button') return sum + 1;
      if (block.type === 'buttons' && Array.isArray(block.items)) return sum + block.items.length;
      return sum;
    }, 0);
    const hasButton = buttonCount > 0;
    const themeProvidesVisual = Boolean(
      (theme as any)?.backgroundImageUrl ||
      (theme as any)?.overlayColor ||
      (theme as any)?.gradientFrom ||
      (theme as any)?.gradientMid ||
      (theme as any)?.gradientTo
    );
    const hasImage = flattened.some(block => {
      const type = String(block?.type || '').toLowerCase();
      if (['image', 'media', 'artwork', 'heroimage', 'visual'].includes(type)) return true;
      return false;
    });
    const hasVisual = hasImage || themeProvidesVisual;

    const copyHint = (() => {
      if (wordCount === 0) return "Ajoutez un court texte pour contextualiser votre proposition.";
      if (wordCount <= 55) return "Parfait, votre message reste percutant.";
      if (wordCount <= 75) return "Élaguez légèrement pour rester sous 55 mots.";
      return "Réduisez votre texte pour conserver l'impact (≤55 mots recommandés).";
    })();

    const checklist: BannerCoachChecklistItem[] = [
      {
        key: 'heading',
        label: 'Titre accrocheur',
        ok: hasHeading,
        hint: "Ajoutez un titre (H1/H2) pour annoncer votre temps fort.",
      },
      {
        key: 'copy',
        label: 'Texte concis',
        ok: wordCount > 0 && wordCount <= 55,
        hint: copyHint,
      },
      {
        key: 'visual',
        label: 'Visuel ou texture',
        ok: hasVisual,
        hint: 'Ajoutez une image/bloc visuel ou activez un fond dans Thème.',
      },
      {
        key: 'cta',
        label: 'CTA principal unique',
        ok: hasButton && buttonCount === 1,
        hint: hasButton && buttonCount > 1
          ? 'Conservez un seul bouton pour éviter les hésitations.'
          : 'Ajoutez un bouton pour guider vos visiteurs.',
      },
      {
        key: 'theme',
        label: 'Thème appliqué à la home',
        ok: applyThemeToHome,
        hint: 'Activez “Appliquer le thème au bandeau” dans l’onglet Thème.',
      },
    ];

    const completed = checklist.filter(item => item.ok).length;
    const score = Math.round((completed / checklist.length) * 100);
    return { score, checklist, wordCount, buttonCount };
  }, [isBanner, blocks, theme, applyThemeToHome]);

  const bannerCanvasDiagnostics: BannerCanvasDiagnostics | null = useMemo(() => {
    if (!isBanner) return null;
    const limit = bannerDesignHeight;
    if (!limit || limit <= 0) return null;
    const used = bannerContentHeight;
    const ratioRaw = limit > 0 ? used / limit : 0;
    const ratioPct = Number((ratioRaw * 100).toFixed(1));
    const ratioLabel = Number.isInteger(ratioPct) ? `${Math.round(ratioPct)}%` : `${ratioPct}%`;
    const overflow = Math.max(0, used - limit);
    const slack = Math.max(0, limit - used);
    return {
      used,
      limit,
      ratioLabel,
      overflow,
      slack,
    };
  }, [isBanner, bannerContentHeight, bannerDesignHeight]);

  const bannerSafeWindowStyle = useMemo(() => {
    if (!isBanner) return null;
    return {}; // Empty style for desktop
  }, [isBanner]);

  const toggleBannerGuides = useCallback(() => {
    setShowBannerGuides(prev => !prev);
  }, []);

  return {
    bannerContentRef,
    showBannerGuides,
    setShowBannerGuides,
    toggleBannerGuides,
    bannerCoach,
    bannerInsights,
    bannerInsightsLoading,
    refreshBannerInsights,
    bannerCanvasDiagnostics,
    bannerSafeWindowStyle,
    formatRelativeTime,
  };
}

export type UseBannerExperienceReturn = ReturnType<typeof useBannerExperience>;
