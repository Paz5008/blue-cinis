import { useCallback, useMemo, useState } from 'react';
import type { Block } from '@/types/cms';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info', duration?: number) => string;

export interface BannerTemplateDraft {
  key: string;
  label: string;
  description?: string;
  familyLabel: string;
  accentColor?: string;
  previewBlocks: Block[];
}

interface OpenDrawerPayload {
  key: string;
  label: string;
  description?: string;
  familyLabel: string;
  accentColor?: string;
}

interface UseBannerTemplateDrawerProps {
  isBanner: boolean;
  getPreviewBlocks: (sectionKey: string) => Block[];
  onApply: (sectionKey: string) => void;
  onMerge: (sectionKey: string, selectedIndices: number[]) => void;
  addToast?: ToastFn;
}

export function useBannerTemplateDrawer({
  isBanner,
  getPreviewBlocks,
  onApply,
  onMerge,
  addToast,
}: UseBannerTemplateDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<BannerTemplateDraft | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const openDrawer = useCallback(
    ({ key, label, description, familyLabel, accentColor }: OpenDrawerPayload) => {
      if (!isBanner) return;
      const previewBlocks = getPreviewBlocks(key) ?? [];
      if (!previewBlocks.length) {
        addToast?.("Impossible de charger l'aperçu de ce modèle pour le moment.", 'error');
        return;
      }
      setDraft({
        key,
        label,
        description,
        familyLabel,
        accentColor,
        previewBlocks,
      });
      setSelectedIndices(previewBlocks.map((_, index) => index));
      setIsOpen(true);
    },
    [isBanner, getPreviewBlocks, addToast]
  );

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    setDraft(null);
    setSelectedIndices([]);
  }, []);

  const toggleIndex = useCallback((index: number) => {
    if (!Number.isFinite(index) || index < 0) return;
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(value => value !== index);
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!draft) return;
    setSelectedIndices(draft.previewBlocks.map((_, idx) => idx));
  }, [draft]);

  const clearSelection = useCallback(() => {
    setSelectedIndices([]);
  }, []);

  const hasSelection = selectedIndices.length > 0;

  const sortedSelection = useMemo(() => [...selectedIndices].sort((a, b) => a - b), [selectedIndices]);

  const applyAll = useCallback(() => {
    if (!draft) return;
    onApply(draft.key);
    closeDrawer();
  }, [draft, onApply, closeDrawer]);

  const mergeSelected = useCallback(() => {
    if (!draft) return;
    const indices = hasSelection ? sortedSelection : draft.previewBlocks.map((_, idx) => idx);
    if (!indices.length) {
      addToast?.('Sélectionnez au moins un bloc à fusionner.', 'info');
      return;
    }
    onMerge(draft.key, indices);
    closeDrawer();
  }, [draft, hasSelection, sortedSelection, onMerge, closeDrawer, addToast]);

  return {
    isOpen,
    draft,
    selectedIndices: sortedSelection,
    openDrawer,
    closeDrawer,
    toggleIndex,
    selectAll,
    clearSelection,
    applyAll,
    mergeSelected,
    hasSelection,
  };
}
