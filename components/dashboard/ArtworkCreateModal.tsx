'use client';

import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X as CloseIcon } from 'lucide-react';
import ArtworkCreateForm, {
  ArtworkPayload,
  CategoryOption,
} from './ArtworkCreateForm';

type ArtworkCreateModalProps = {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  onCreated: (artwork: ArtworkPayload) => void;
};

export default function ArtworkCreateModal({
  open,
  onClose,
  categories,
  onCreated,
}: ArtworkCreateModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleClose, open]);

  const handleOverlayClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === overlayRef.current) {
        handleClose();
      }
    },
    [handleClose],
  );

  const handleCreated = useCallback(
    (artwork: ArtworkPayload) => {
      onCreated(artwork);
      handleClose();
    },
    [handleClose, onCreated],
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="artwork-modal-title"
    >
      <div
        ref={dialogRef}
        className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Inventaire
            </p>
            <h2 id="artwork-modal-title" className="text-xl font-semibold text-slate-900">
              Ajouter une nouvelle œuvre
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Renseignez les informations principales ; l’œuvre sera disponible immédiatement dans vos sections « Affiche » et « Bandeau ».
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Fermer la fenêtre d’ajout d’œuvre"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 py-6 overscroll-contain"
          data-lenis-prevent
        >
          <ArtworkCreateForm categories={categories} onCreated={handleCreated} />
        </div>
      </div>
    </div>,
    document.body
  );
}
