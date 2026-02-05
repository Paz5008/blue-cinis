"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";

type Props = {
  initialEnableCommerce?: boolean | null;
  initialEnableLeads?: boolean | null;
  settingsUnavailable?: boolean;
};

export default function CommerceSettingsForm({
  initialEnableCommerce = null,
  initialEnableLeads = null,
  settingsUnavailable = false,
}: Props) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enableCommerce, setEnableCommerce] = useState(initialEnableCommerce ?? false);
  const [enableLeads, setEnableLeads] = useState(initialEnableLeads ?? false);
  const [blocked, setBlocked] = useState(settingsUnavailable);

  useEffect(() => {
    setBlocked(settingsUnavailable);
  }, [settingsUnavailable]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/artist/profile", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(data?.error || "Erreur");
        if (typeof data.enableCommerce === "boolean") {
          setEnableCommerce(!!data.enableCommerce);
        }
        if (typeof data.enableLeads === "boolean") {
          setEnableLeads(!!data.enableLeads);
        }
        setBlocked(false);
      } catch (error: any) {
        addToast(error?.message || "Impossible de charger vos réglages", "error");
        setBlocked(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [addToast]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      fd.set("name", "Artiste");
      if (enableCommerce) fd.set("enableCommerce", "true");
      else fd.set("enableCommerceOff", "");
      if (enableLeads) fd.set("enableLeads", "true");
      else fd.set("enableLeadsOff", "");
      const res = await fetch("/api/artist/profile", { method: "PUT", body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Enregistrement impossible");
      addToast("Préférences boutique mises à jour", "success");
    } catch (error: any) {
      addToast(error?.message || "Erreur lors de l’enregistrement", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--cms-text-secondary)]">Chargement de vos préférences…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="space-y-3 rounded-lg border border-[var(--cms-border)] bg-[var(--cms-surface)] p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            aria-label="Activer la vente en ligne"
            type="checkbox"
            checked={enableCommerce}
            onChange={(event) => setEnableCommerce(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--cms-border-strong)] bg-white text-[var(--cms-accent-color)] focus:ring-[var(--cms-accent-color)] focus:ring-offset-0"
            disabled={blocked}
          />
          <span>
            <span className="font-medium text-[var(--cms-text-primary)]">Activer la vente en ligne</span>
            <span className="block text-xs text-[var(--cms-text-secondary)]">
              Vos œuvres passent en achat immédiat avec paiement via Stripe.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            aria-label="Activer les demandes d’achat"
            type="checkbox"
            checked={enableLeads}
            onChange={(event) => setEnableLeads(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--cms-border-strong)] bg-white text-[var(--cms-accent-color)] focus:ring-[var(--cms-accent-color)] focus:ring-offset-0"
            disabled={blocked}
          />
          <span>
            <span className="font-medium text-[var(--cms-text-primary)]">Activer les demandes d’achat</span>
            <span className="block text-xs text-[var(--cms-text-secondary)]">
              Recevez des leads et discutez avant de confirmer la vente.
            </span>
          </span>
        </label>
      </div>
      {blocked && !loading && (
        <p className="text-xs text-amber-500">Les interrupteurs sont verrouillés tant que les préférences ne sont pas synchronisées.</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || blocked}
          className="rounded bg-[var(--cms-text-primary)] text-[var(--cms-bg)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-colors"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
