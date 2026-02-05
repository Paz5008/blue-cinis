"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import AuditTimeline, { type AuditEntry } from "../../../_components/AuditTimeline";

type ArtistDetail = {
  id: string;
  name: string;
  biography: string | null;
  artStyle: string | null;
  photoUrl: string | null;
  contactEmail: string | null;
  phone: string | null;
  portfolio: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  enableCommerce: boolean;
  enableLeads: boolean;
  allowInternationalShipping: boolean;
  defaultShippingFee: number | null;
  processingTimeDays: number | null;
  deliveryBannerMessage: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

type Metrics = {
  artworks: number;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

type Props = {
  initialArtist: ArtistDetail;
  auditLogs: AuditEntry[];
  metrics: Metrics;
};

const formatCentsToInput = (value: number | null) => {
  if (typeof value !== "number") return "";
  const euros = value / 100;
  return euros % 1 === 0 ? String(euros) : euros.toFixed(2);
};

export default function ArtistDetailClient({ initialArtist, auditLogs, metrics }: Props) {
  const router = useRouter();
  const confirmedRef = useRef<ArtistDetail>(initialArtist);
  const [artist, setArtist] = useState(initialArtist);
  const [bioForm, setBioForm] = useState(() => ({
    name: initialArtist.name,
    artStyle: initialArtist.artStyle ?? "",
    biography: initialArtist.biography ?? "",
  }));
  const [contactForm, setContactForm] = useState(() => ({
    contactEmail: initialArtist.contactEmail ?? "",
    phone: initialArtist.phone ?? "",
    portfolio: initialArtist.portfolio ?? "",
    instagramUrl: initialArtist.instagramUrl ?? "",
    facebookUrl: initialArtist.facebookUrl ?? "",
    photoUrl: initialArtist.photoUrl ?? "",
  }));
  const [commerceForm, setCommerceForm] = useState(() => ({
    enableCommerce: initialArtist.enableCommerce,
    enableLeads: initialArtist.enableLeads,
    allowInternationalShipping: initialArtist.allowInternationalShipping,
    defaultShippingFee: formatCentsToInput(initialArtist.defaultShippingFee),
    processingTimeDays: initialArtist.processingTimeDays?.toString() ?? "",
    deliveryBannerMessage: initialArtist.deliveryBannerMessage ?? "",
  }));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [featuredBusy, setFeaturedBusy] = useState(false);
  const [auditEntries, setAuditEntries] = useState(auditLogs);
  const [refreshingAudit, setRefreshingAudit] = useState(false);

  useEffect(() => {
    confirmedRef.current = initialArtist;
    setArtist(initialArtist);
    setBioForm({
      name: initialArtist.name,
      artStyle: initialArtist.artStyle ?? "",
      biography: initialArtist.biography ?? "",
    });
    setContactForm({
      contactEmail: initialArtist.contactEmail ?? "",
      phone: initialArtist.phone ?? "",
      portfolio: initialArtist.portfolio ?? "",
      instagramUrl: initialArtist.instagramUrl ?? "",
      facebookUrl: initialArtist.facebookUrl ?? "",
      photoUrl: initialArtist.photoUrl ?? "",
    });
    setCommerceForm({
      enableCommerce: initialArtist.enableCommerce,
      enableLeads: initialArtist.enableLeads,
      allowInternationalShipping: initialArtist.allowInternationalShipping,
      defaultShippingFee: formatCentsToInput(initialArtist.defaultShippingFee),
      processingTimeDays: initialArtist.processingTimeDays?.toString() ?? "",
      deliveryBannerMessage: initialArtist.deliveryBannerMessage ?? "",
    });
  }, [initialArtist]);

  useEffect(() => {
    setAuditEntries(auditLogs);
    setRefreshingAudit(false);
  }, [auditLogs]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const metricsList = useMemo(
    () => [
      { label: "Œuvres publiées", value: metrics.artworks },
      { label: "Commerce", value: artist.enableCommerce ? "Activé" : "Suspendu" },
      { label: "Leads", value: artist.enableLeads ? "Collectés" : "Fermés" },
    ],
    [metrics.artworks, artist.enableCommerce, artist.enableLeads],
  );

  const applyOptimistic = (patch: Partial<ArtistDetail>) => {
    setArtist((prev) => ({ ...prev, ...patch }));
  };

  const revertArtist = () => {
    setArtist(confirmedRef.current);
  };

  const commitArtist = (next: ArtistDetail) => {
    confirmedRef.current = next;
    setArtist(next);
  };

  const submitSection = async (
    section: string,
    payload: Record<string, unknown>,
    optimisticPatch?: Partial<ArtistDetail>,
    message = "Modifications enregistrées.",
    onSuccess?: (updated: ArtistDetail) => void,
  ) => {
    setSavingSection(section);
    setFeedback(null);
    if (optimisticPatch) {
      applyOptimistic(optimisticPatch);
    }
    try {
      const res = await fetch(`/api/admin/artists/${artist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason = typeof data?.error === "string" ? data.error : "Enregistrement impossible";
        throw new Error(reason);
      }
      commitArtist(data as ArtistDetail);
      onSuccess?.(data as ArtistDetail);
      setFeedback({ type: "success", message });
      refreshAudit();
    } catch (error) {
      revertArtist();
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Erreur inattendue" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleBioSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bioForm.name.trim()) {
      setFeedback({ type: "error", message: "Le nom est obligatoire." });
      return;
    }
    submitSection(
      "bio",
      {
        name: bioForm.name.trim(),
        artStyle: bioForm.artStyle.trim() || null,
        biography: bioForm.biography.trim() || null,
      },
      {
        name: bioForm.name.trim(),
        artStyle: bioForm.artStyle.trim() || null,
        biography: bioForm.biography.trim() || null,
      },
      "Profil mis à jour.",
    );
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSection(
      "contact",
      {
        contactEmail: contactForm.contactEmail.trim() || null,
        phone: contactForm.phone.trim() || null,
        portfolio: contactForm.portfolio.trim() || null,
        instagramUrl: contactForm.instagramUrl.trim() || null,
        facebookUrl: contactForm.facebookUrl.trim() || null,
        photoUrl: contactForm.photoUrl.trim() || null,
      },
      {
        contactEmail: contactForm.contactEmail.trim() || null,
        phone: contactForm.phone.trim() || null,
        portfolio: contactForm.portfolio.trim() || null,
        instagramUrl: contactForm.instagramUrl.trim() || null,
        facebookUrl: contactForm.facebookUrl.trim() || null,
        photoUrl: contactForm.photoUrl.trim() || null,
      },
      "Contacts et médias mis à jour.",
    );
  };

  const parseShippingFee = (value: string) => {
    if (!value.trim()) return null;
    const normalized = value.replace(",", ".").trim();
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      return undefined;
    }
    return Math.max(0, Math.round(Number(normalized) * 100));
  };

  const parseProcessingDays = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 60) return undefined;
    return Math.round(parsed);
  };

  const handleCommerceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const shippingFee = parseShippingFee(commerceForm.defaultShippingFee);
    if (shippingFee === undefined) {
      setFeedback({ type: "error", message: "Frais d’expédition invalides (2 décimales max)." });
      return;
    }
    const processingDays = parseProcessingDays(commerceForm.processingTimeDays);
    if (processingDays === undefined) {
      setFeedback({ type: "error", message: "Délais de préparation invalides (0-60 jours)." });
      return;
    }
    submitSection(
      "commerce",
      {
        enableCommerce: commerceForm.enableCommerce,
        enableLeads: commerceForm.enableLeads,
        allowInternationalShipping: commerceForm.allowInternationalShipping,
        defaultShippingFee: shippingFee,
        processingTimeDays: processingDays,
        deliveryBannerMessage: commerceForm.deliveryBannerMessage.trim() || null,
      },
      {
        enableCommerce: commerceForm.enableCommerce,
        enableLeads: commerceForm.enableLeads,
        allowInternationalShipping: commerceForm.allowInternationalShipping,
        defaultShippingFee: shippingFee ?? null,
        processingTimeDays: processingDays ?? null,
        deliveryBannerMessage: commerceForm.deliveryBannerMessage.trim() || null,
      },
      "Paramètres commerciaux enregistrés.",
    );
  };

  const toggleActive = async () => {
    const next = !artist.isActive;
    setStatusBusy(true);
    applyOptimistic({ isActive: next });
    try {
      const res = await fetch(`/api/admin/artists/${artist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Action impossible");
      }
      const updated = { ...confirmedRef.current, isActive: payload.isActive as boolean };
      commitArtist(updated);
      setFeedback({ type: "success", message: next ? "Artiste activé." : "Artiste désactivé." });
      refreshAudit();
    } catch (error) {
      revertArtist();
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Erreur inattendue" });
    } finally {
      setStatusBusy(false);
    }
  };

  const toggleFeatured = async () => {
    const next = !artist.isFeatured;
    setFeaturedBusy(true);
    applyOptimistic({ isFeatured: next });
    try {
      const res = await fetch(`/api/admin/artists/${artist.id}/featured`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: next }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Action impossible");
      }
      const updated = { ...confirmedRef.current, isFeatured: payload.isFeatured as boolean };
      commitArtist(updated);
      setFeedback({ type: "success", message: next ? "Artiste mis en avant." : "Retiré de la vitrine." });
      refreshAudit();
    } catch (error) {
      revertArtist();
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Erreur inattendue" });
    } finally {
      setFeaturedBusy(false);
    }
  };

  const refreshAudit = () => {
    setRefreshingAudit(true);
    router.refresh();
  };

  return (
    <div className="space-y-6 p-8">
      <Link href="/admin/artists" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" />
        Retour aux artistes
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fiche artiste</p>
            <h1 className="text-3xl font-semibold text-slate-900">{artist.name}</h1>
            <p className="text-sm text-slate-500">
              Statut&nbsp;
              <span className={artist.isActive ? "text-emerald-600" : "text-rose-600"}>
                {artist.isActive ? "Actif" : "Désactivé"}
              </span>
              {artist.artStyle && <> · {artist.artStyle}</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleActive}
              disabled={statusBusy}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
                artist.isActive ? "bg-slate-700 hover:bg-slate-800" : "bg-emerald-600 hover:bg-emerald-700"
              } ${statusBusy ? "opacity-60" : ""}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {artist.isActive ? "Désactiver" : "Activer"}
            </button>
            <button
              type="button"
              onClick={toggleFeatured}
              disabled={featuredBusy}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                artist.isFeatured
                  ? "border border-fuchsia-200 bg-white text-fuchsia-700 hover:bg-fuchsia-50"
                  : "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
              } ${featuredBusy ? "opacity-60" : ""}`}
            >
              <Star className="h-4 w-4" />
              {artist.isFeatured ? "Retirer vitrine" : "Mettre en vitrine"}
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bio & identité</p>
                <p className="text-xs text-slate-400">Nom public, positionnement et biographie détaillée.</p>
              </div>
            </div>
            <form onSubmit={handleBioSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Nom</span>
                  <input
                    value={bioForm.name}
                    onChange={(event) => setBioForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Discipline / signature</span>
                  <input
                    value={bioForm.artStyle}
                    onChange={(event) => setBioForm((prev) => ({ ...prev, artStyle: event.target.value }))}
                    placeholder="Sculpture, illustration…"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Biographie</span>
                <textarea
                  value={bioForm.biography}
                  onChange={(event) => setBioForm((prev) => ({ ...prev, biography: event.target.value }))}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  placeholder="Parcours, intentions, récompenses…"
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSection === "bio"}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingSection === "bio" ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contacts & médias</p>
              <p className="text-xs text-slate-400">Coordonnées directes, liens sociaux et visuel principal.</p>
            </div>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Email de contact</span>
                  <input
                    type="email"
                    value={contactForm.contactEmail}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="artiste@galerie.fr"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Téléphone</span>
                  <input
                    value={contactForm.phone}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="+33…"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Portfolio / site</span>
                  <input
                    value={contactForm.portfolio}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, portfolio: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="https://"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Photo (URL)</span>
                  <input
                    value={contactForm.photoUrl}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, photoUrl: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="https://cdn…"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Instagram</span>
                  <input
                    value={contactForm.instagramUrl}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, instagramUrl: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="https://instagram.com/..."
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Facebook</span>
                  <input
                    value={contactForm.facebookUrl}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, facebookUrl: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="https://facebook.com/..."
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSection === "contact"}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingSection === "contact" ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Commerce & logistique</p>
              <p className="text-xs text-slate-400">Activation boutique, délais et message rassurant.</p>
            </div>
            <form onSubmit={handleCommerceSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={commerceForm.enableCommerce}
                    onChange={(event) => setCommerceForm((prev) => ({ ...prev, enableCommerce: event.target.checked }))}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">Boutique ouverte</span>
                    <span className="block text-xs text-slate-500">
                      Autorise la mise en vente et la capture de paiement.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={commerceForm.enableLeads}
                    onChange={(event) => setCommerceForm((prev) => ({ ...prev, enableLeads: event.target.checked }))}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">Collecter des leads</span>
                    <span className="block text-xs text-slate-500">
                      Autorise les formulaires de prises de contact.
                    </span>
                  </span>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Frais d’expédition (€)</span>
                  <input
                    value={commerceForm.defaultShippingFee}
                    onChange={(event) => setCommerceForm((prev) => ({ ...prev, defaultShippingFee: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="0.00"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Délais (jours)</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={commerceForm.processingTimeDays}
                    onChange={(event) => setCommerceForm((prev) => ({ ...prev, processingTimeDays: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={commerceForm.allowInternationalShipping}
                  onChange={(event) =>
                    setCommerceForm((prev) => ({ ...prev, allowInternationalShipping: event.target.checked }))
                  }
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold text-slate-900">Expédition internationale</span>
                  <span className="block text-xs text-slate-500">
                    Autorise les commandes hors France métropolitaine.
                  </span>
                </span>
              </label>
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Message rassurant</span>
                <input
                  value={commerceForm.deliveryBannerMessage}
                  onChange={(event) =>
                    setCommerceForm((prev) => ({ ...prev, deliveryBannerMessage: event.target.value }))
                  }
                  maxLength={200}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  placeholder={'Ex: "Expédié sous 3 à 5 jours"'}
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSection === "commerce"}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingSection === "commerce" ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Synthèse</p>
            <div className="mt-4 space-y-3">
              {metricsList.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">{metric.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{metric.value}</p>
                </div>
              ))}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Dernière mise à jour</p>
                <p className="text-sm text-slate-800">{new Date(artist.updatedAt).toLocaleString("fr-FR")}</p>
              </div>
            </div>
          </div>

          <AuditTimeline
            title="Historique"
            description="Dernières actions auditées pour cette fiche."
            entries={auditEntries}
            refreshing={refreshingAudit}
            onRefresh={refreshAudit}
            emptyLabel="Aucune action récente sur cette fiche."
          />
        </div>
      </div>
    </div>
  );
}
