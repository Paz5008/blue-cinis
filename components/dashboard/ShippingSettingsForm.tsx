"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function ShippingSettingsForm() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [allowInternationalShipping, setAllowInternationalShipping] = useState(false);
  const [processingTimeDays, setProcessingTimeDays] = useState<number | "">("");
  const [defaultShippingFee, setDefaultShippingFee] = useState<string>("");
  const [deliveryBannerMessage, setDeliveryBannerMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/artist/profile", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(data?.error || "Erreur");
        setContactEmail(data.contactEmail || "");
        setAllowInternationalShipping(!!data.allowInternationalShipping);
        const ptd = typeof data.processingTimeDays === "number" ? data.processingTimeDays : "";
        setProcessingTimeDays(ptd as any);
        const feeCents = typeof data.defaultShippingFee === "number" ? data.defaultShippingFee : null;
        setDefaultShippingFee(feeCents != null ? String(Math.max(0, Math.round(feeCents)) / 100) : "");
        setDeliveryBannerMessage(data.deliveryBannerMessage || "");
      } catch (error: any) {
        addToast(error?.message || "Impossible de charger vos paramètres d’expédition", "error");
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
      if (contactEmail) fd.set("contactEmail", contactEmail);
      else fd.set("contactEmail", "");
      if (allowInternationalShipping) fd.set("allowInternationalShipping", "true");
      else fd.set("allowInternationalShippingOff", "");
      if (defaultShippingFee !== "") fd.set("defaultShippingFee", String(defaultShippingFee));
      else fd.set("defaultShippingFee", "");
      if (processingTimeDays !== "") fd.set("processingTimeDays", String(processingTimeDays));
      else fd.set("processingTimeDays", "");
      if (deliveryBannerMessage) fd.set("deliveryBannerMessage", deliveryBannerMessage);
      else fd.set("deliveryBannerMessage", "");
      const res = await fetch("/api/artist/profile", { method: "PUT", body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Enregistrement impossible");
      addToast("Paramètres d’expédition enregistrés", "success");
    } catch (error: any) {
      addToast(error?.message || "Erreur lors de l’enregistrement", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500 italic">Chargement de vos informations…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email de contact</span>
          <input
            type="email"
            placeholder="vous@exemple.com"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="block text-xs text-slate-500">
            Utilisé pour les confirmations de commande et les notifications clients.
          </span>
        </label>
        <label className="text-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Délais de préparation (jours)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={processingTimeDays === "" ? "" : Number(processingTimeDays)}
            onChange={(event) => {
              const v = event.target.value;
              setProcessingTimeDays(v === "" ? "" : Math.max(0, Math.min(60, Math.round(Number(v) || 0))));
            }}
            className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="block text-xs text-slate-500">
            Visible lors du checkout pour informer l’acheteur.
          </span>
        </label>
        <label className="text-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frais d’expédition par défaut (€)</span>
          <div className="flex rounded-lg bg-white border border-gray-200 overflow-hidden">
            <span className="flex items-center px-3 text-slate-500 bg-gray-50 select-none">€</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={defaultShippingFee}
              onChange={(event) => {
                const v = event.target.value;
                if (v === "" || /^\d*(?:[\.,]\d{0,2})?$/.test(v)) {
                  setDefaultShippingFee(v.replace(",", "."));
                }
              }}
              className="flex-1 bg-transparent px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="block text-xs text-slate-500">
            Ajustez ce montant pour couvrir vos coûts d’emballage et de transport.
          </span>
        </label>
        <label className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 text-sm mt-6 md:mt-0 transition hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={allowInternationalShipping}
            onChange={(event) => setAllowInternationalShipping(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
            aria-label="Autoriser l’expédition internationale"
          />
          <span className="flex-1">
            <span className="font-medium text-slate-900 block mb-0.5">Expédition internationale</span>
            <span className="block text-xs text-slate-500">
              Permettez aux acheteurs hors France de passer commande.
            </span>
          </span>
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message rassurant</span>
        <input
          type="text"
          maxLength={200}
          placeholder={'Ex: "Expédié sous 3 à 5 jours"'}
          value={deliveryBannerMessage}
          onChange={(event) => setDeliveryBannerMessage(event.target.value)}
          className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span className="block text-xs text-slate-500">
          Affiché sur votre boutique pour rassurer les acheteurs (200 caractères max).
        </span>
      </label>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 text-white font-medium px-6 py-2.5 text-sm hover:opacity-90 disabled:opacity-60 transition-colors"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
