"use client";

import { ReactNode, useEffect, MouseEvent } from "react";

type AdminModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function AdminModal({ title, description, onClose, children }: AdminModalProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-slate-400 transition hover:text-slate-600"
            aria-label="Fermer"
          >
            &#215;
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
