import { Fragment, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Block } from '@/types/cms';
import { X as CloseIcon, CheckSquare as CheckedIcon, Square as UncheckedIcon, Layers as LayersIcon, RefreshCcw as RefreshIcon } from 'lucide-react';
import type { BannerTemplateDraft } from './useBannerTemplateDrawer';

interface BannerTemplateDrawerProps {
  open: boolean;
  draft: BannerTemplateDraft | null;
  selectedIndices: number[];
  hasSelection: boolean;
  onToggleBlock: (index: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onApplyAll: () => void;
  onMergeSelected: () => void;
  onClose: () => void;
  renderPreviewBlock: (block: Block, index: number) => ReactNode;
  currentBlockCount: number;
}

export function BannerTemplateDrawer({
  open,
  draft,
  selectedIndices,
  hasSelection,
  onToggleBlock,
  onSelectAll,
  onClearSelection,
  onApplyAll,
  onMergeSelected,
  onClose,
  renderPreviewBlock,
  currentBlockCount,
}: BannerTemplateDrawerProps) {
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const getFocusableElements = (root: HTMLElement | null) => {
    if (!root) return [] as HTMLElement[];
    const selectors =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter(
      element => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
    );
  };

  useEffect(() => {
    if (!open) return;
    const root = drawerRef.current;
    if (!root) return;
    const focusable = getFocusableElements(root);
    const focusTarget = closeButtonRef.current ?? focusable[0] ?? root;
    const frame = requestAnimationFrame(() => {
      focusTarget?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const root = drawerRef.current;
      if (!root) return;
      const focusable = getFocusableElements(root);
      if (focusable.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (!active || active === first || !root.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last || !root.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !draft) return null;

  const { label, description, familyLabel, accentColor, previewBlocks } = draft;
  const totalBlocks = previewBlocks.length;

  return (
    <div className="fixed inset-0 z-[1100] flex items-stretch justify-end">
      <button
        type="button"
        aria-label="Fermer le tiroir de modèles"
        tabIndex={-1}
        onClick={onClose}
        className="flex-1 bg-black/50 backdrop-blur-sm"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Tiroir de modèles bandeau – ${label}`}
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-black/10"
        tabIndex={-1}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">{familyLabel}</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: accentColor || '#2563eb' }}
              />
              {label}
            </h2>
            {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 bg-white p-2 text-gray-500 transition hover:text-gray-700"
            aria-label="Fermer"
            ref={closeButtonRef}
          >
            <CloseIcon size={18} aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <section className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-800">
            <div className="flex items-start gap-3">
              <LayersIcon size={18} className="mt-0.5 flex-shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">
                  {totalBlocks} bloc{totalBlocks > 1 ? 's' : ''} prêts à l’emploi
                </p>
                <p className="mt-1 text-[13px] text-blue-700/80">
                  Votre bandeau actuel contient {currentBlockCount} bloc{currentBlockCount > 1 ? 's' : ''}. Sélectionnez
                  ceux que vous souhaitez fusionner ou appliquez le modèle complet.
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Blocs du modèle</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                >
                  Tout sélectionner
                </button>
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                >
                  Effacer
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {previewBlocks.map((block, index) => {
                const selected = selectedIndices.includes(index);
                return (
                  <Fragment key={(block as any)?.id ?? index}>
                    <div
                      className={`rounded-xl border bg-white transition ${
                        selected ? 'border-blue-300 shadow-sm shadow-blue-100/50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleBlock(index)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-gray-300 bg-white p-1 text-gray-500">
                            {selected ? <CheckedIcon size={16} aria-hidden /> : <UncheckedIcon size={16} aria-hidden />}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            Bloc {index + 1}
                          </span>
                        </div>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          {selected ? 'Sélectionné' : 'Ajouter'}
                        </span>
                      </button>
                      <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 text-sm text-gray-600">
                        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                          {renderPreviewBlock(block, index)}
                        </div>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </section>
        </div>
        <footer className="border-t border-gray-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onApplyAll}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshIcon size={16} aria-hidden />
              Appliquer tout le modèle
            </button>
            <button
              type="button"
              onClick={onMergeSelected}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-blue-300 hover:text-blue-700"
            >
              Fusionner la sélection
              <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {hasSelection ? `${selectedIndices.length}/${totalBlocks}` : 'tout'}
              </span>
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
