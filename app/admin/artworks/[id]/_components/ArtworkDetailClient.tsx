"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Layers2, Sparkles } from "lucide-react";
import AuditTimeline, { type AuditEntry } from "../../../_components/AuditTimeline";
import { buildArtworkPath } from "@/lib/artworkSlug";

type ArtworkDetail = {
  id: string;
  title: string;
  artistId: string;
  artistName: string | null;
  price: number;
  imageUrl: string | null;
  description: string | null;
  dimensions: string | null;
  year: number | null;
  categoryId: string | null;
  stockQuantity: number | null;
  isAvailable: boolean;
  reservedUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

type ArtistOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
};

type Metrics = {
  variants: number;
  reservations: number;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

type Props = {
  initialArtwork: ArtworkDetail;
  artistOptions: ArtistOption[];
  categoryOptions: CategoryOption[];
  auditLogs: AuditEntry[];
  metrics: Metrics;
};

export default function ArtworkDetailClient({ initialArtwork, artistOptions, categoryOptions, auditLogs, metrics }: Props) {
  const router = useRouter();
  const confirmedRef = useRef<ArtworkDetail>(initialArtwork);
  const [artwork, setArtwork] = useState(initialArtwork);
  const [generalForm, setGeneralForm] = useState(() => ({
    title: initialArtwork.title,
    artistId: initialArtwork.artistId,
    categoryId: initialArtwork.categoryId ?? "",
    dimensions: initialArtwork.dimensions ?? "",
    year: initialArtwork.year?.toString() ?? "",
  }));
  const [commerceForm, setCommerceForm] = useState(() => ({
    price: initialArtwork.price.toString(),
    stockQuantity: initialArtwork.stockQuantity?.toString() ?? "",
    isAvailable: initialArtwork.isAvailable,
  }));
  const [narrativeForm, setNarrativeForm] = useState(() => ({
    description: initialArtwork.description ?? "",
    imageUrl: initialArtwork.imageUrl ?? "",
  }));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState(auditLogs);
  const [refreshingAudit, setRefreshingAudit] = useState(false);

  useEffect(() => {
    confirmedRef.current = initialArtwork;
    setArtwork(initialArtwork);
    setGeneralForm({
      title: initialArtwork.title,
      artistId: initialArtwork.artistId,
      categoryId: initialArtwork.categoryId ?? "",
      dimensions: initialArtwork.dimensions ?? "",
      year: initialArtwork.year?.toString() ?? "",
    });
    setCommerceForm({
      price: initialArtwork.price.toString(),
      stockQuantity: initialArtwork.stockQuantity?.toString() ?? "",
      isAvailable: initialArtwork.isAvailable,
    });
    setNarrativeForm({
      description: initialArtwork.description ?? "",
      imageUrl: initialArtwork.imageUrl ?? "",
    });
  }, [initialArtwork]);

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
      { label: "Variantes", value: metrics.variants },
      { label: "Réservations actives", value: metrics.reservations },
      {
        label: "Disponibilité",
        value: artwork.isAvailable ? "En vente" : "Hors catalogue",
      },
    ],
    [metrics.variants, metrics.reservations, artwork.isAvailable],
  );

  const applyOptimistic = (patch: Partial<ArtworkDetail>) => {
    setArtwork((prev) => ({ ...prev, ...patch }));
  };

  const revertArtwork = () => {
    setArtwork(confirmedRef.current);
  };

  const commitArtwork = (next: ArtworkDetail) => {
    confirmedRef.current = next;
    setArtwork(next);
  };

  const submitSection = async (
    section: string,
    payload: Record<string, unknown>,
    optimisticPatch?: Partial<ArtworkDetail>,
    message = "Modifications enregistrées.",
    onSuccess?: (updated: ArtworkDetail) => void,
  ) => {
    setSavingSection(section);
    setFeedback(null);
    if (optimisticPatch) {
      applyOptimistic(optimisticPatch);
    }
    try {
      const res = await fetch(`/api/admin/artworks/${artwork.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Enregistrement impossible");
      }
      commitArtwork(data as ArtworkDetail);
      onSuccess?.(data as ArtworkDetail);
      setFeedback({ type: "success", message });
      refreshAudit();
    } catch (error) {
      revertArtwork();
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Erreur inattendue" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleGeneralSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!generalForm.title.trim()) {
      setFeedback({ type: "error", message: "Le titre est obligatoire." });
      return;
    }
    if (!generalForm.artistId) {
      setFeedback({ type: "error", message: "Sélectionnez un artiste." });
      return;
    }
    let yearValue: number | null = null;
    if (generalForm.year.trim()) {
      const parsed = Number(generalForm.year);
      if (!Number.isInteger(parsed) || parsed < 1000 || parsed > 9999) {
        setFeedback({ type: "error", message: "Année invalide." });
        return;
      }
      yearValue = parsed;
    }
    submitSection(
      "general",
      {
        title: generalForm.title.trim(),
        artistId: generalForm.artistId,
        categoryId: generalForm.categoryId || null,
        dimensions: generalForm.dimensions.trim() || null,
        year: yearValue,
      },
      {
        title: generalForm.title.trim(),
        artistId: generalForm.artistId,
        artistName: artistOptions.find((option) => option.id === generalForm.artistId)?.name ?? artwork.artistName,
        categoryId: generalForm.categoryId || null,
        dimensions: generalForm.dimensions.trim() || null,
        year: yearValue,
      },
      "Informations générales enregistrées.",
    );
  };

  const handleCommerceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commerceForm.price.trim() || Number.isNaN(Number(commerceForm.price))) {
      setFeedback({ type: "error", message: "Prix invalide." });
      return;
    }
    const priceValue = Math.max(0, Math.round(Number(commerceForm.price)));
    let stockValue: number | null = null;
    if (commerceForm.stockQuantity.trim()) {
      const parsed = Number(commerceForm.stockQuantity);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setFeedback({ type: "error", message: "Stock invalide." });
        return;
      }
      stockValue = parsed;
    }
    submitSection(
      "commerce",
      {
        price: priceValue,
        stockQuantity: stockValue,
        isAvailable: commerceForm.isAvailable,
      },
      {
        price: priceValue,
        stockQuantity: stockValue,
        isAvailable: commerceForm.isAvailable,
      },
      "Paramètres commerciaux mis à jour.",
    );
  };

  const handleNarrativeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSection(
      "narrative",
      {
        description: narrativeForm.description.trim() || null,
        imageUrl: narrativeForm.imageUrl.trim() || null,
      },
      {
        description: narrativeForm.description.trim() || null,
        imageUrl: narrativeForm.imageUrl.trim() || null,
      },
      "Description enregistrée.",
    );
  };

  const refreshAudit = () => {
    setRefreshingAudit(true);
    router.refresh();
  };

  const statusBadge = artwork.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600";

  return (
    <div className="space-y-6 p-8">
      <Link href="/admin/artworks" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" />
        Retour aux œuvres
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fiche œuvre</p>
            <h1 className="text-3xl font-semibold text-slate-900">{artwork.title}</h1>
            <p className="text-sm text-slate-500">
              {artwork.artistName || "Artiste non renseigné"}
              {artwork.reservedUntil && (
                <>
                  {" · "}
                  <span className="text-amber-600">
                    Réservée jusqu’au {new Date(artwork.reservedUntil).toLocaleDateString("fr-FR")}
                  </span>
                </>
              )}
            </p>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}>
              {artwork.isAvailable ? "Disponible" : "Indisponible"}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/artworks/${artwork.id}/variants`}
              className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-fuchsia-700"
            >
              <Layers2 className="h-4 w-4" />
              Variantes
            </Link>
            <Link
              href={buildArtworkPath({ id: artwork.id, title: artwork.title })}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4" />
              Voir en vitrine
            </Link>
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
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Informations générales</p>
              <p className="text-xs text-slate-400">Titre, artiste associé, catégorie et détails physiques.</p>
            </div>
            <form onSubmit={handleGeneralSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Titre</span>
                  <input
                    value={generalForm.title}
                    onChange={(event) => setGeneralForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Artiste</span>
                  <select
                    value={generalForm.artistId}
                    onChange={(event) => setGeneralForm((prev) => ({ ...prev, artistId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  >
                    {artistOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} {option.isActive ? "" : "(inactif)"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Catégorie</span>
                  <select
                    value={generalForm.categoryId}
                    onChange={(event) => setGeneralForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  >
                    <option value="">—</option>
                    {categoryOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Dimensions</span>
                  <input
                    value={generalForm.dimensions}
                    onChange={(event) => setGeneralForm((prev) => ({ ...prev, dimensions: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="80 x 40 cm"
                  />
                </label>
              </div>
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Année</span>
                <input
                  value={generalForm.year}
                  onChange={(event) => setGeneralForm((prev) => ({ ...prev, year: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  placeholder="2023"
                  maxLength={4}
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSection === "general"}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingSection === "general" ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prix & disponibilité</p>
              <p className="text-xs text-slate-400">Montant catalogue, stock disponible et statut.</p>
            </div>
            <form onSubmit={handleCommerceSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Prix (€)</span>
                  <input
                    value={commerceForm.price}
                    onChange={(event) => setCommerceForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    inputMode="numeric"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs font-semibold uppercase text-slate-500">Stock</span>
                  <input
                    value={commerceForm.stockQuantity}
                    onChange={(event) => setCommerceForm((prev) => ({ ...prev, stockQuantity: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="1"
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={commerceForm.isAvailable}
                  onChange={(event) => setCommerceForm((prev) => ({ ...prev, isAvailable: event.target.checked }))}
                  className="h-4 w-4"
                />
                <span>
                  <span className="font-semibold text-slate-900">Oeuvre disponible à la vente</span>
                  <span className="block text-xs text-slate-500">
                    Désactivez-la pour la retirer du catalogue sans la supprimer.
                  </span>
                </span>
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

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Narratif & média</p>
              <p className="text-xs text-slate-400">Description éditoriale et visuel principal.</p>
            </div>
            <form onSubmit={handleNarrativeSubmit} className="space-y-4">
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Description</span>
                <textarea
                  value={narrativeForm.description}
                  onChange={(event) => setNarrativeForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  placeholder="Inspiration, techniques, histoire…"
                />
              </label>
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Image (URL)</span>
                <input
                  value={narrativeForm.imageUrl}
                  onChange={(event) => setNarrativeForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  placeholder="https://cdn..."
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSection === "narrative"}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingSection === "narrative" ? "Enregistrement…" : "Enregistrer"}
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
                <p className="text-xs text-slate-500">Mis à jour le</p>
                <p className="text-sm text-slate-800">{new Date(artwork.updatedAt).toLocaleString("fr-FR")}</p>
              </div>
            </div>
          </div>

          <AuditTimeline
            title="Historique"
            description="Dernières actions auditées pour cette œuvre."
            entries={auditEntries}
            refreshing={refreshingAudit}
            onRefresh={refreshAudit}
            emptyLabel="Aucune action récente sur cette œuvre."
          />
        </div>
      </div>
    </div>
  );
}
