"use client";

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ArtworkSort, ArtworkClientFiltersPreset } from '@/lib/adminFilters';
import { ArtworkFilterPreset } from '@/lib/adminFilters';
import AdminModal from '../../_components/AdminModal';
import { SensitiveConfirmDialog } from '@/components/admin/SensitiveConfirmDialog';
import { buildArtworkPath } from '@/lib/artworkSlug';

type Artwork = {
  id: string;
  title: string;
  price?: number | null;
  imageUrl?: string | null;
  artistName?: string | null;
};

type ArtworksResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Artwork[];
};

type Filters = {
  q: string;
  sort: ArtworkSort;
};

type ArtistOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

type Props = {
  data: ArtworksResponse;
  filters: Filters;
  artistOptions: ArtistOption[];
};

const sortOptions: { label: string; value: ArtworkSort }[] = [
  { label: 'Création (récents)', value: 'createdAt_desc' },
  { label: 'Création (anciens)', value: 'createdAt_asc' },
  { label: 'Prix décroissant', value: 'price_desc' },
  { label: 'Prix croissant', value: 'price_asc' },
];

export default function ArtworksClient({ data, filters, artistOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [formState, setFormState] = useState<Filters>(filters);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<Artwork | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    setFormState(filters);
  }, [filters]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 20))), [data]);

  const pushWithFilters = (overrides: Partial<Filters & { page?: number }>) => {
    const next: ArtworkClientFiltersPreset = {
      ...formState,
      ...overrides,
    };
    const page = overrides.page ?? data.page ?? 1;
    const params = ArtworkFilterPreset.buildSearchParams(
      {
        q: next.q,
        sort: next.sort,
      },
      { page, pageSize: data.pageSize },
    );
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const applyFilters = () => pushWithFilters({ page: 1 });
  const goToPage = (page: number) => pushWithFilters({ page });

  const handleCreationSuccess = () => {
    setFeedback({ type: 'success', message: 'Œuvre publiée.' });
    router.refresh();
  };

  const handleCreationError = (message: string) => {
    setFeedback({ type: 'error', message });
  };

  const handleDelete = (artwork: Artwork) => {
    setPendingDeletion(artwork);
  };

  const confirmDeletion = async ({ mfaToken }: { mfaToken?: string | null }) => {
    if (!mfaToken) {
      throw new Error('Validation MFA requise pour supprimer une œuvre.')
    }
    const target = pendingDeletion;
    if (!target) {
      throw new Error('Aucune œuvre sélectionnée.');
    }
    setDeleteId(target.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/artworks/${target.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-mfa-token': mfaToken },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || 'Suppression impossible');
      }
      setFeedback({ type: 'success', message: 'Œuvre supprimée.' });
      router.refresh();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erreur inattendue';
      setFeedback({ type: 'error', message: reason });
      throw error;
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Œuvres</h1>
          <p className="text-sm text-slate-500">
            Parcourez le catalogue, ajustez le tri et accédez rapidement aux variantes ou aux pages publiques.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Nouvelle œuvre
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Recherche</label>
          <input
            value={formState.q}
            onChange={(event) => setFormState((prev) => ({ ...prev, q: event.target.value }))}
            placeholder="titre, artiste ou ID"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tri</label>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
            value={formState.sort}
            onChange={(event) => setFormState((prev) => ({ ...prev, sort: event.target.value as ArtworkSort }))}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          Appliquer
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.items.map((artwork) => (
          <div key={artwork.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-sm">
            {artwork.imageUrl && (
              <img src={artwork.imageUrl} alt={artwork.title} className="w-24 h-24 rounded-xl object-cover" />
            )}
            <div className="flex-1 space-y-1">
              <div className="font-medium text-slate-900">{artwork.title}</div>
              <div className="text-xs text-slate-500">{artwork.artistName || '—'}</div>
              {typeof artwork.price === 'number' && (
                <div className="text-sm font-semibold text-slate-800">{artwork.price} €</div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/admin/artworks/${artwork.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Fiche
                </Link>
                <Link
                  href={`/admin/artworks/${artwork.id}/variants`}
                  className="rounded-lg bg-fuchsia-600 px-3 py-1 text-xs font-medium text-white hover:bg-fuchsia-700"
                >
                  Variantes
                </Link>
                <Link
                  href={buildArtworkPath({ id: artwork.id, title: artwork.title })}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Voir
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(artwork)}
                  disabled={deleteId === artwork.id || pendingDeletion?.id === artwork.id}
                  className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleteId === artwork.id ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {data.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Aucune œuvre pour ces critères.
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        <button
          disabled={data.page <= 1 || isPending}
          onClick={() => goToPage(data.page - 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          Précédent
        </button>
        <span>
          Page {data.page} / {totalPages}
        </span>
        <button
          disabled={data.page >= totalPages || isPending}
          onClick={() => goToPage(data.page + 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>

      {isCreateModalOpen && (
        <AdminModal
          title="Ajouter une œuvre"
          description="Publiez rapidement une nouvelle pièce dans le catalogue."
          onClose={() => setIsCreateModalOpen(false)}
        >
          <CreateArtworkForm
            artists={artistOptions}
            onCreated={() => {
              handleCreationSuccess();
              setIsCreateModalOpen(false);
            }}
            onError={handleCreationError}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </AdminModal>
      )}

      <SensitiveConfirmDialog
        open={Boolean(pendingDeletion)}
        title={pendingDeletion ? `Supprimer « ${pendingDeletion.title} »` : 'Supprimer'}
        description="Action définitive, l’œuvre disparaîtra du back-office."
        scope="artworks.delete"
        confirmLabel="Supprimer"
        confirmTone="danger"
        onConfirm={confirmDeletion}
        onDismiss={() => setPendingDeletion(null)}
        context={
          <p>
            Cette action retire immédiatement l’œuvre, ses variantes et ses liens publics. Les commandes déjà encaissées
            restent accessibles dans les historiques.
          </p>
        }
        metadata={
          pendingDeletion
            ? [
                { label: 'Identifiant', value: pendingDeletion.id },
                { label: 'Titre', value: pendingDeletion.title },
              ]
            : undefined
        }
      />
    </div>
  );
}

type CreateArtworkFormProps = {
  artists: ArtistOption[];
  onCreated: () => void;
  onError: (message: string) => void;
  onCancel?: () => void;
};

function CreateArtworkForm({ artists, onCreated, onError, onCancel }: CreateArtworkFormProps) {
  const [form, setForm] = useState(() => ({
    title: '',
    artistId: artists[0]?.id || '',
    price: '',
    imageUrl: '',
    description: '',
    dimensions: '',
    year: '',
    isAvailable: true,
  }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((prev) => {
      if (prev.artistId) return prev;
      return { ...prev, artistId: artists[0]?.id || '' };
    });
  }, [artists]);

  const handleChange =
    (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = field === 'isAvailable' ? (event.target as HTMLInputElement).checked : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!form.title.trim()) {
      onError('Le titre est obligatoire.');
      return;
    }
    if (!form.artistId) {
      onError('Sélectionnez un artiste.');
      return;
    }
    if (!form.imageUrl.trim()) {
      onError('Ajoutez une image.');
      return;
    }
    const priceValue = Number(form.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      onError('Prix invalide.');
      return;
    }
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      artistId: form.artistId,
      price: priceValue,
      imageUrl: form.imageUrl.trim(),
      isAvailable: form.isAvailable,
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.dimensions.trim()) payload.dimensions = form.dimensions.trim();
    if (form.year.trim()) {
      const yearValue = Number(form.year);
      if (!Number.isInteger(yearValue)) {
        onError('Année invalide.');
        return;
      }
      payload.year = yearValue;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Impossible de créer cette œuvre');
      }
      onCreated();
      setForm({
        title: '',
        artistId: artists[0]?.id || '',
        price: '',
        imageUrl: '',
        description: '',
        dimensions: '',
        year: '',
        isAvailable: true,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erreur inattendue';
      onError(reason);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = artists.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {disabled && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Créez d’abord un artiste pour pouvoir associer l’œuvre.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Titre</label>
          <input
            value={form.title}
            onChange={handleChange('title')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Nom de l’œuvre"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Artiste</label>
          <select
            value={form.artistId}
            onChange={handleChange('artistId')}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={disabled}
          >
            <option value="">Sélectionnez un artiste</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name} {artist.isActive ? '' : '(inactif)'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Prix (€)</label>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={handleChange('price')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="1500"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Image (URL)</label>
          <input
            value={form.imageUrl}
            onChange={handleChange('imageUrl')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="https://…"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Dimensions</label>
          <input
            value={form.dimensions}
            onChange={handleChange('dimensions')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="80 x 60 cm"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Année</label>
          <input
            type="number"
            min="1800"
            max="2099"
            value={form.year}
            onChange={handleChange('year')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="2025"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={handleChange('description')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Quelques lignes sur l’œuvre…"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={handleChange('isAvailable')}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Disponible à la vente
        </label>
      </div>
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={submitting}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || disabled}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Enregistrement…' : 'Créer l’œuvre'}
        </button>
      </div>
    </form>
  );
}
