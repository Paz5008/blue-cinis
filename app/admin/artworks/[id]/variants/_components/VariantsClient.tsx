"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

type Artwork = { id: string; title: string; price?: number | null };

type Variant = {
  id: string;
  name: string;
  priceOverride?: number | null;
  stockQuantity?: number | null;
  available: number;
  reserved?: number;
};

type Props = {
  artworkId: string;
};

type VariantFormState = {
  name: string;
  stock: string;
  price: string;
};

type VariantFormErrors = {
  name: string | null;
  stock: string | null;
  price: string | null;
};

type VariantFormTouched = Record<keyof VariantFormState, boolean>;

type VariantUpdatePatch = {
  name?: string;
  stockQuantity?: number;
  priceOverride?: number | null;
};

const integerFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

const formatInteger = (value: number | null | undefined) => integerFormatter.format(typeof value === "number" && Number.isFinite(value) ? value : 0);
const formatPrice = (value: number | null | undefined) => (typeof value === "number" ? `${value.toLocaleString("fr-FR")} €` : "—");
const blankTouched = (): VariantFormTouched => ({ name: false, stock: false, price: false });

const validateVariantForm = (values: VariantFormState): VariantFormErrors => {
  const errors: VariantFormErrors = { name: null, stock: null, price: null };
  const trimmedName = values.name.trim();
  if (!trimmedName) {
    errors.name = "Nom requis";
  } else if (trimmedName.length < 2) {
    errors.name = "2 caractères minimum";
  }

  const stockValue = Number(values.stock);
  if (values.stock.trim() === "") {
    errors.stock = "Stock requis";
  } else if (!Number.isFinite(stockValue)) {
    errors.stock = "Valeur invalide";
  } else if (!Number.isInteger(stockValue)) {
    errors.stock = "Nombre entier requis";
  } else if (stockValue < 0) {
    errors.stock = "Minimum 0";
  }

  if (values.price.trim()) {
    const priceValue = Number(values.price);
    if (!Number.isFinite(priceValue)) {
      errors.price = "Valeur invalide";
    } else if (!Number.isInteger(priceValue)) {
      errors.price = "Nombre entier requis";
    } else if (priceValue < 0) {
      errors.price = "Minimum 0";
    }
  }

  return errors;
};

const hasErrors = (errors: VariantFormErrors) => Boolean(errors.name || errors.stock || errors.price);

const variantFormFromVariant = (variant: Variant): VariantFormState => ({
  name: variant.name,
  stock: String(typeof variant.stockQuantity === "number" ? variant.stockQuantity : 1),
  price: typeof variant.priceOverride === "number" ? String(variant.priceOverride) : "",
});

const sanitizeToPositiveInt = (value: string, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
};

export default function VariantsClient({ artworkId }: Props) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [formState, setFormState] = useState<VariantFormState>({ name: "", stock: "1", price: "" });
  const [formTouched, setFormTouched] = useState<VariantFormTouched>(blankTouched);
  const [saving, setSaving] = useState(false);

  const formErrors = useMemo(() => validateVariantForm(formState), [formState]);
  const canSubmit = !hasErrors(formErrors);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const [artRes, varRes] = await Promise.all([
          fetch(`/api/admin/artworks/${artworkId}`, { cache: "no-store" }),
          fetch(`/api/artworks/${artworkId}/variants?scope=admin`, { cache: "no-store" }),
        ]);
        if (!artRes.ok) throw new Error("Impossible de charger l’œuvre");
        const artJson = await artRes.json();
        const varJson = await varRes.json();
        if (!varRes.ok) throw new Error(varJson?.error || "Impossible de charger les variantes");
        setArtwork(artJson);
        setVariants(varJson);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue");
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [artworkId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreateVariant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormTouched({ name: true, stock: true, price: true });
    if (!canSubmit) {
      addToast("Vérifiez les informations de la variante.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formState.name.trim(),
        stockQuantity: sanitizeToPositiveInt(formState.stock, 1),
      };
      if (formState.price.trim()) {
        payload.priceOverride = sanitizeToPositiveInt(formState.price, 0);
      }
      const res = await fetch(`/api/artworks/${artworkId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Création impossible");
      }
      addToast("Variante créée avec succès.", "success");
      setFormState({ name: "", stock: "1", price: "" });
      setFormTouched(blankTouched());
      await load({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inattendue";
      addToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const saveVariant = async (id: string, patch: VariantUpdatePatch) => {
    try {
      const payload: Record<string, unknown> = {};
      if (typeof patch.name === "string") payload.name = patch.name.trim();
      if (typeof patch.stockQuantity === "number") payload.stockQuantity = patch.stockQuantity;
      if (Object.prototype.hasOwnProperty.call(patch, "priceOverride")) {
        payload.priceOverride = patch.priceOverride;
      }
      if (Object.keys(payload).length === 0) return true;
      const res = await fetch(`/api/variants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Mise à jour impossible");
      }
      addToast("Variante mise à jour.", "success");
      await load({ silent: true });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inattendue";
      addToast(message, "error");
      return false;
    }
  };

  const deleteVariant = async (id: string) => {
    try {
      const res = await fetch(`/api/variants/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Suppression impossible");
      }
      addToast("Variante supprimée.", "success");
      await load({ silent: true });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inattendue";
      addToast(message, "error");
      return false;
    }
  };

  const metrics = useMemo(() => {
    const totalVariants = variants.length;
    let totalStock = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    variants.forEach((variant) => {
      const stock = typeof variant.stockQuantity === "number" ? variant.stockQuantity : 1;
      const reserved = variant.reserved ?? 0;
      const available = typeof variant.available === "number" ? variant.available : stock - reserved;
      totalStock += stock;
      totalReserved += reserved;
      totalAvailable += available;
    });
    const sellThrough = totalStock > 0 ? Math.round(((totalStock - totalAvailable) / totalStock) * 100) : 0;
    return { totalVariants, totalStock, totalReserved, totalAvailable, sellThrough };
  }, [variants]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">Chargement de l’inventaire…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-xl space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          <p className="font-medium">Impossible de charger les variantes.</p>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const availabilityTone = metrics.totalAvailable < 0 ? "danger" : "emerald";
  const availabilityHelper =
    metrics.totalAvailable < 0
      ? `Sur-réservé de ${formatInteger(Math.abs(metrics.totalAvailable))}`
      : metrics.totalStock > 0
        ? `${metrics.sellThrough}% réservés`
        : "Aucun stock déclaré";

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/artworks" className="font-medium text-slate-600 transition hover:text-slate-900">
          ← Catalogue
        </Link>
        <span aria-hidden="true">/</span>
        <span>Gestion des variantes</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-slate-400">Inventaire</p>
          <h1 className="text-3xl font-semibold text-slate-900">{artwork?.title ?? "Œuvre"}</h1>
          <p className="text-sm text-slate-500">
            Suivez les déclinaisons, les stocks disponibles et les réservations actives sans quitter la console.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-right shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Prix catalogue</p>
          <p className="text-xl font-semibold text-slate-900">{formatPrice(artwork?.price ?? null)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InventoryMetric label="Variantes actives" value={formatInteger(metrics.totalVariants)} helper="SKU suivis" />
        <InventoryMetric label="Stock cumulé" value={formatInteger(metrics.totalStock)} helper="Unités déclarées" />
        <InventoryMetric label="Réservées" value={formatInteger(metrics.totalReserved)} helper="En attente de paiement" tone="amber" />
        <InventoryMetric
          label="Disponibles"
          value={formatInteger(metrics.totalAvailable)}
          helper={availabilityHelper}
          tone={availabilityTone}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr),minmax(0,1fr)]">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Variantes actives</h2>
              <p className="text-sm text-slate-500">Mettez à jour les quantités, ajustez les intitulés et suivez la capacité disponible.</p>
            </div>
            {refreshing && <span className="text-xs font-medium text-slate-500">Synchronisation…</span>}
          </div>

          {variants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Aucune variante n’est définie. Utilisez le formulaire pour créer vos déclinaisons (formats, finitions, séries limitées…).
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant) => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  basePrice={artwork?.price}
                  onSave={(patch) => saveVariant(variant.id, patch)}
                  onDelete={() => deleteVariant(variant.id)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Nouvelle variante</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Décliner l’œuvre</h2>
            <p className="text-sm text-slate-500">Renseignez un intitulé clair (format, série, matériau) et définissez le stock initial.</p>
          </div>
          <form className="space-y-4" onSubmit={handleCreateVariant} noValidate>
            <FormField
              label="Nom"
              value={formState.name}
              onChange={(value) => setFormState((prev) => ({ ...prev, name: value }))}
              onBlur={() => setFormTouched((prev) => ({ ...prev, name: true }))}
              placeholder="Ex : Édition pigmentaire A2"
              error={formTouched.name ? formErrors.name : null}
            />
            <FormField
              label="Stock"
              type="number"
              min={0}
              value={formState.stock}
              onChange={(value) => setFormState((prev) => ({ ...prev, stock: value }))}
              onBlur={() => setFormTouched((prev) => ({ ...prev, stock: true }))}
              helper="Unités disponibles immédiatement"
              error={formTouched.stock ? formErrors.stock : null}
            />
            <FormField
              label="Prix spécifique"
              type="number"
              min={0}
              value={formState.price}
              onChange={(value) => setFormState((prev) => ({ ...prev, price: value }))}
              onBlur={() => setFormTouched((prev) => ({ ...prev, price: true }))}
              helper="Laissez vide pour appliquer le prix catalogue"
              error={formTouched.price ? formErrors.price : null}
            />
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Création…" : "Créer la variante"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  helper?: string;
  error?: string | null;
  type?: string;
  min?: number;
};

function FormField({ label, value, onChange, onBlur, placeholder, helper, error, type = "text", min }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        min={min}
        placeholder={placeholder}
        className={`w-full rounded-2xl border px-4 py-2.5 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
          error ? "border-rose-300" : "border-slate-200 bg-white"
        }`}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

type InventoryMetricProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "amber" | "emerald" | "danger";
};

function InventoryMetric({ label, value, helper, tone = "default" }: InventoryMetricProps) {
  const toneClasses =
    tone === "amber"
      ? "border-amber-100 bg-amber-50"
      : tone === "emerald"
        ? "border-emerald-100 bg-emerald-50"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white";
  return (
    <div className={`rounded-2xl border ${toneClasses} p-4 shadow-sm`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}

type VariantCardProps = {
  variant: Variant;
  basePrice?: number | null;
  onSave: (patch: VariantUpdatePatch) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
};

function VariantCard({ variant, basePrice, onSave, onDelete }: VariantCardProps) {
  const [form, setForm] = useState<VariantFormState>(() => variantFormFromVariant(variant));
  const [touched, setTouched] = useState<VariantFormTouched>(blankTouched);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(variantFormFromVariant(variant));
    setTouched(blankTouched());
    setConfirmDelete(false);
  }, [variant]);

  const errors = useMemo(() => validateVariantForm(form), [form]);

  const initialStock = typeof variant.stockQuantity === "number" ? variant.stockQuantity : 1;
  const nextStock = sanitizeToPositiveInt(form.stock, initialStock);
  const currentPrice = typeof variant.priceOverride === "number" ? variant.priceOverride : null;
  const nextPrice = form.price.trim() ? sanitizeToPositiveInt(form.price, currentPrice ?? 0) : null;
  const nameChanged = form.name.trim() !== variant.name;
  const stockChanged = nextStock !== initialStock;
  const priceChanged = nextPrice !== currentPrice;
  const dirty = nameChanged || stockChanged || priceChanged;
  const disableSave = busy === "save" || !dirty || hasErrors(errors);

  const reserved = variant.reserved ?? 0;
  const available = typeof variant.available === "number" ? variant.available : initialStock - reserved;
  const shortage = available < 0;
  const fillPercent = initialStock > 0 ? Math.max(0, Math.min(100, Math.round((available / initialStock) * 100))) : 0;
  const appliedPrice = typeof variant.priceOverride === "number" ? variant.priceOverride : basePrice ?? null;
  const hasOverride = typeof variant.priceOverride === "number";

  const handleSave = async () => {
    setTouched({ name: true, stock: true, price: true });
    if (disableSave) return;
    setBusy("save");
    const patch: VariantUpdatePatch = {};
    if (nameChanged) patch.name = form.name.trim();
    if (stockChanged) patch.stockQuantity = nextStock;
    if (priceChanged) {
      patch.priceOverride = nextPrice;
    }
    const ok = await onSave(patch);
    if (ok) {
      setTouched(blankTouched());
    }
    setBusy(null);
  };

  const handleReset = () => {
    setForm(variantFormFromVariant(variant));
    setTouched(blankTouched());
  };

  const requestDelete = () => {
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    setBusy("delete");
    const ok = await onDelete();
    if (ok) {
      setConfirmDelete(false);
    }
    setBusy(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-wide text-slate-400">Nom commercial</label>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            className={`mt-1 w-full rounded-2xl border px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
              touched.name && errors.name ? "border-rose-300" : "border-slate-200"
            }`}
          />
          {touched.name && errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name}</p> : null}
        </div>
        <div className="w-full max-w-[160px]">
          <label className="text-xs uppercase tracking-wide text-slate-400">Prix appliqué</label>
          <div className="mt-1 text-right">
            <p className="text-lg font-semibold text-slate-900">{formatPrice(appliedPrice)}</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                hasOverride ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {hasOverride ? "Override" : "Catalogue"}
            </span>
          </div>
        </div>
      </div>
      {shortage && (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
          Sur-réservé de {formatInteger(Math.abs(available))} unité(s). Traitez les commandes ou ajustez le stock.
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <FieldInline
          label="Stock"
          type="number"
          min={0}
          value={form.stock}
          onChange={(value) => setForm((prev) => ({ ...prev, stock: value }))}
          onBlur={() => setTouched((prev) => ({ ...prev, stock: true }))}
          error={touched.stock ? errors.stock : null}
        />
        <FieldInline
          label="Prix spécifique"
          type="number"
          min={0}
          value={form.price}
          onChange={(value) => setForm((prev) => ({ ...prev, price: value }))}
          onBlur={() => setTouched((prev) => ({ ...prev, price: true }))}
          helper="Laissez vide pour appliquer le prix catalogue"
          error={touched.price ? errors.price : null}
        />
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Statut stock</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">Déclaré : {formatInteger(initialStock)}</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800">Réservé : {formatInteger(reserved)}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 ${shortage ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}
            >
              Disponible : {formatInteger(available)}
            </span>
          </div>
        </div>
      </div>

      {initialStock > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Capacité disponible</span>
            <span>{fillPercent}%</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={disableSave}
          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "save" ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={busy === "save" || busy === "delete" || !dirty}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={requestDelete}
          disabled={busy === "delete"}
          className="ml-auto rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>

      {confirmDelete && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-medium">Supprimer « {variant.name} » ?</p>
          <p className="text-xs text-rose-600">L’historique des réservations est conservé mais ce format disparaitra du catalogue.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy === "delete"}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {busy === "delete" ? "Suppression…" : "Confirmer"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={busy === "delete"}
              className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-medium text-rose-700 transition hover:bg-white"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type FieldInlineProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  helper?: string;
  error?: string | null;
  type?: string;
  min?: number;
};

function FieldInline({ label, value, onChange, onBlur, helper, error, type = "text", min }: FieldInlineProps) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-slate-400">{label}</label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`mt-1 w-full rounded-2xl border px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
          error ? "border-rose-300" : "border-slate-200"
        }`}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}
