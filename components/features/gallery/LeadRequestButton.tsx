"use client";

import { useEffect, useMemo, useState } from 'react';
import { executeRecaptcha } from '@/lib/recaptcha';

type Props = {
  artworkId?: string;
  artworkTitle?: string;
  className?: string;
};

const emptyForm = { name: '', email: '', phone: '', note: '' };

function loadDraft(key: string) {
  if (typeof window === 'undefined') return { ...emptyForm };
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return { ...emptyForm };
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed?.name === 'string' ? parsed.name : '',
      email: typeof parsed?.email === 'string' ? parsed.email : '',
      phone: typeof parsed?.phone === 'string' ? parsed.phone : '',
      note: typeof parsed?.note === 'string' ? parsed.note : '',
    };
  } catch {
    return { ...emptyForm };
  }
}

export default function LeadRequestButton({ artworkId, artworkTitle, artworkImage, className }: Props & { artworkImage?: string }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storageKey = useMemo(() => `lead-request-${artworkId ?? 'general'}`, [artworkId]);
  const [form, setForm] = useState(() => loadDraft(storageKey));
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    setForm(loadDraft(storageKey));
    setConfirmClose(false);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hasContent = Object.values(form).some((value) => value.trim().length > 0);
      if (!hasContent) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      window.sessionStorage.setItem(storageKey, JSON.stringify(form));
    } catch {
      // ignore storage errors
    }
  }, [form, storageKey]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      let recaptchaToken: string | undefined = undefined;
      // Execute Recaptcha only if key is present
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        try {
          const token = await executeRecaptcha('lead');
          if (token) recaptchaToken = token;
        } catch (err) {
          console.warn('Recaptcha failed, proceeding without it', err);
        }
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.note || undefined,
          artworkId,
          recaptchaToken,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Erreur lors de l\'envoi.');
      }
      setMessage('Votre demande a été envoyée. Nous vous recontactons rapidement.');
      setForm({ ...emptyForm });
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(storageKey);
        }
      } catch {
        // ignore
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  const hasDraft = Object.values(form).some((value) => value.trim().length > 0);

  const closeModal = () => {
    setOpen(false);
    setConfirmClose(false);
  };

  const requestClose = () => {
    if (submitting) return;
    if (hasDraft && !message) {
      setConfirmClose(true);
      return;
    }
    closeModal();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || 'w-full inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-transparent px-8 py-4 text-sm font-medium text-[#d4af37] transition-all hover:bg-[#d4af37] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2'}
      >
        Demander à acquérir
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-sm transition-all duration-300">
          <div
            className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row"
            role="dialog"
            aria-modal="true"
          >
            {/* Context Section (Left/Top) */}
            <div className="relative h-48 w-full bg-zinc-50 md:h-auto md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-100">
              {artworkImage ? (
                <div className="absolute inset-0">
                  <img src={artworkImage} alt={artworkTitle} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-100 text-zinc-400">
                  <span className="text-sm">Pas d'image</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 lg:hidden p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
                <h3 className="font-serif text-lg leading-tight">{artworkTitle}</h3>
              </div>
              <div className="hidden lg:flex flex-col justify-end h-full p-8 absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                <p className="text-xs font-medium uppercase tracking-wider text-white/80 mb-2">Vous souhaitez acquérir</p>
                <h3 className="font-serif text-2xl text-white leading-tight">{artworkTitle}</h3>
              </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 p-6 md:p-8 lg:p-10 bg-white">
              <div className="mb-8 flex items-center justify-between">
                <div className="md:hidden">
                  {/* Header handled in Image setup for mobile to save space, or here if needed */}
                </div>
                <div className="hidden md:block">
                  <h2 className="text-xl font-medium text-zinc-900">Formulaire de demande</h2>
                  <p className="text-sm text-zinc-500 mt-1">Nous vous répondrons sous 24h.</p>
                </div>
                <button onClick={requestClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition">✕</button>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                {message && <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm border border-emerald-100 flex items-center gap-2">✓ {message}</div>}
                {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Nom complet <span className="text-red-500">*</span></label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-zinc-50 border-zinc-200 rounded-lg px-4 py-3 text-sm focus:border-zinc-900 focus:ring-zinc-900 transition-colors" placeholder="Votre nom" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email <span className="text-red-500">*</span></label>
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-zinc-50 border-zinc-200 rounded-lg px-4 py-3 text-sm focus:border-zinc-900 focus:ring-zinc-900 transition-colors" placeholder="votre@email.com" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Téléphone (optionnel)</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-zinc-50 border-zinc-200 rounded-lg px-4 py-3 text-sm focus:border-zinc-900 focus:ring-zinc-900 transition-colors" placeholder="Pour un contact plus direct" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Votre message</label>
                  <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="w-full bg-zinc-50 border-zinc-200 rounded-lg px-4 py-3 text-sm focus:border-zinc-900 focus:ring-zinc-900 transition-colors resize-none" rows={4} placeholder="Je suis intéressé par cette œuvre. Est-elle toujours disponible ? Quels sont les frais de livraison pour..." />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={requestClose} className="px-6 py-3 rounded-full text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition">Annuler</button>
                  <button type="submit" disabled={submitting} className="min-w-[160px] px-8 py-3 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-zinc-900/10 transition-all transform active:scale-95">
                    {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                  </button>
                </div>

                {confirmClose && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 animate-in fade-in slide-in-from-top-1">
                    <p className="mb-3 font-medium">Vous avez commencé à écrire. Voulez-vous vraiment abandonner ?</p>
                    <div className="flex gap-3">
                      <button type="button" className="underline hover:text-amber-700" onClick={() => setConfirmClose(false)}>Non, continuer</button>
                      <button type="button" className="font-semibold hover:text-amber-700" onClick={closeModal}>Oui, fermer</button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
