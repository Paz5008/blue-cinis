"use client";

import Link from 'next/link';
import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from 'react';
import AdminModal from '../../_components/AdminModal';
import { useToast } from '@/context/ToastContext';
import { SensitiveConfirmDialog } from '@/components/admin/SensitiveConfirmDialog';

type Artist = {
  id: string;
  name: string;
  isActive: boolean;
  isFeatured: boolean;
};

type Props = {
  initialArtists: Artist[];
};

export default function ArtistsClient({ initialArtists }: Props) {
  const { addToast } = useToast();
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [query, setQuery] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Artist | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [_isPending, startTransition] = useTransition();

  const metrics = useMemo(() => {
    const total = artists.length;
    const active = artists.filter((artist) => artist.isActive).length;
    const featured = artists.filter((artist) => artist.isFeatured).length;
    return [
      { label: 'Total', value: total },
      { label: 'Actifs', value: active },
      { label: 'Mise en avant', value: featured },
    ];
  }, [artists]);

  const filteredArtists = useMemo(() => {
    if (!query.trim()) return artists;
    const lowered = query.trim().toLowerCase();
    return artists.filter(
      (artist) =>
        artist.name.toLowerCase().includes(lowered) || artist.id.toLowerCase().includes(lowered),
    );
  }, [artists, query]);

  const handleCreateSuccess = (artist: Artist) => {
    setArtists((current) => [artist, ...current]);
    addToast('Artiste ajouté.', 'success');
  };

  const handleDelete = (artist: Artist) => {
    setDeleteTarget(artist);
  };

  const confirmDeletion = async (_?: { mfaToken?: string | null }) => {
    if (!deleteTarget) {
      return;
    }
    setPendingId(deleteTarget.id);
    try {
      const response = await fetch(`/api/admin/artists/${deleteTarget.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Suppression impossible');
      }
      setArtists((current) => current.filter((entry) => entry.id !== deleteTarget.id));
      addToast('Artiste supprimé.', 'success');
      setDeleteTarget(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erreur inattendue';
      addToast(reason, 'error');
      throw new Error(reason);
    } finally {
      setPendingId(null);
    }
  };

  const mutateArtist = async (
    targetId: string,
    url: string,
    options: RequestInit & { body: string },
    updater: (artist: Artist) => Artist,
    successMessage: string,
  ) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Action impossible');
      }
      setArtists((current) => current.map((artist) => (artist.id === targetId ? updater(artist) : artist)));
      addToast(successMessage, 'success');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erreur inattendue';
      addToast(reason, 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleActive = (artist: Artist, nextValue: boolean) => {
    setPendingId(artist.id);
    startTransition(() => {
      void mutateArtist(
        artist.id,
        `/api/admin/artists/${artist.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: nextValue }),
        },
        (current) => ({ ...current, isActive: nextValue }),
        nextValue ? 'Artiste activé' : 'Artiste désactivé',
      );
    });
  };

  const handleToggleFeatured = (artist: Artist, nextValue: boolean) => {
    setPendingId(artist.id);
    startTransition(() => {
      void mutateArtist(
        artist.id,
        `/api/admin/artists/${artist.id}/featured`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFeatured: nextValue }),
        },
        (current) => ({ ...current, isFeatured: nextValue }),
        nextValue ? 'Artiste mis en avant' : 'Retiré des artistes en avant',
      );
    });
  };

  const disabled = (artistId: string) => pendingId === artistId;

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Artistes</h1>
          <p className="text-sm text-slate-500">
            Suivez l’activité des profils, activez les comptes validés et choisissez les talents mis en avant.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Nouvel artiste
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <label htmlFor="artist-search" className="sr-only">
            Rechercher un artiste
          </label>
          <input
            id="artist-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom ou ID"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <span className="text-xs text-slate-500">{filteredArtists.length} résultat(s)</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Artiste</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Mise en avant</th>
              <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredArtists.map((artist) => (
              <tr key={artist.id} className="align-middle">
                <td className="px-4 py-3">
                  <div>
                    <Link
                      href={`/admin/artists/${artist.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {artist.name}
                    </Link>
                  </div>
                  <div className="text-xs text-slate-500">{artist.id}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={artist.isActive ? 'actif' : 'inactif'} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={artist.isFeatured ? 'en vitrine' : 'standard'} tone="featured" active={artist.isFeatured} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => handleToggleActive(artist, !artist.isActive)}
                      disabled={disabled(artist.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                        artist.isActive ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
                      } ${disabled(artist.id) ? 'opacity-50' : ''}`}
                    >
                      {artist.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleToggleFeatured(artist, !artist.isFeatured)}
                      disabled={disabled(artist.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        artist.isFeatured
                          ? 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100'
                          : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'
                      } ${disabled(artist.id) ? 'opacity-50' : ''}`}
                    >
                      {artist.isFeatured ? 'Retirer' : 'Mettre en avant'}
                    </button>
                    <Link
                      href={`/admin/artists/${artist.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Ouvrir
                    </Link>
                    <button
                      onClick={() => handleDelete(artist)}
                      disabled={disabled(artist.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                        disabled(artist.id) ? 'opacity-50 bg-rose-300' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredArtists.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                  Aucun artiste ne correspond à cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isCreateModalOpen && (
        <AdminModal
          title="Créer un artiste"
          description="Ajoutez un profil basique. Les champs optionnels peuvent être renseignés plus tard."
          onClose={() => setIsCreateModalOpen(false)}
        >
          <CreateArtistForm
            onCreated={(artist) => {
              handleCreateSuccess(artist);
              setIsCreateModalOpen(false);
            }}
            onError={(message) => addToast(message, 'error')}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </AdminModal>
      )}
      <SensitiveConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Supprimer ${deleteTarget.name}` : 'Supprimer'}
        description="Cette suppression est définitive et sera consignée dans l’audit."
        scope="artists.delete"
        requireMfa={false}
        confirmLabel="Supprimer"
        onConfirm={confirmDeletion}
        onDismiss={() => setDeleteTarget(null)}
        context={
          <p>
            L’artiste sera retiré de la console ainsi que des listings publics. Pensez à réassigner ou archiver les
            œuvres associées avant de poursuivre.
          </p>
        }
        metadata={
          deleteTarget
            ? [
                { label: 'Identifiant', value: deleteTarget.id },
                { label: 'Nom', value: deleteTarget.name },
              ]
            : undefined
        }
      />
    </div>
  );
}

function StatusBadge({
  value,
  tone = 'default',
  active,
}: {
  value: string;
  tone?: 'default' | 'featured';
  active?: boolean;
}) {
  const variants =
    tone === 'featured'
      ? active
        ? 'bg-fuchsia-100 text-fuchsia-800'
        : 'bg-slate-100 text-slate-600'
      : value === 'actif'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-slate-200 text-slate-600';

  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${variants}`}>{value}</span>;
}

type CreateArtistFormProps = {
  onCreated: (artist: Artist) => void;
  onError: (message: string) => void;
  onCancel?: () => void;
};

function CreateArtistForm({ onCreated, onError, onCancel }: CreateArtistFormProps) {
  const [form, setForm] = useState({
    name: '',
    artStyle: '',
    contactEmail: '',
    photoUrl: '',
    portfolio: '',
    instagramUrl: '',
    facebookUrl: '',
    phone: '',
    biography: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!form.name.trim()) {
      onError('Le nom est obligatoire.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { name: form.name.trim() };
      (['artStyle', 'contactEmail', 'photoUrl', 'portfolio', 'instagramUrl', 'facebookUrl', 'phone', 'biography'] as const).forEach(
        (field) => {
          const value = form[field].trim();
          if (value) payload[field] = value;
        },
      );
      const res = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Impossible de créer cet artiste');
      }
      const created = (await res.json()) as Artist;
      onCreated(created);
      setForm({
        name: '',
        artStyle: '',
        contactEmail: '',
        photoUrl: '',
        portfolio: '',
        instagramUrl: '',
        facebookUrl: '',
        phone: '',
        biography: '',
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erreur inattendue';
      onError(reason);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange =
    (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Nom</label>
          <input
            value={form.name}
            onChange={handleChange('name')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Nom public"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Style artistique</label>
          <input
            value={form.artStyle}
            onChange={handleChange('artStyle')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Illustration, sculpture, etc."
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Email contact</label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={handleChange('contactEmail')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="contact@exemple.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Téléphone</label>
          <input
            value={form.phone}
            onChange={handleChange('phone')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="+33…"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Photo (URL)</label>
          <input
            value={form.photoUrl}
            onChange={handleChange('photoUrl')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Portfolio</label>
          <input
            value={form.portfolio}
            onChange={handleChange('portfolio')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Site web, Behance…"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Instagram</label>
          <input
            value={form.instagramUrl}
            onChange={handleChange('instagramUrl')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="https://instagram.com/…"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Facebook</label>
          <input
            value={form.facebookUrl}
            onChange={handleChange('facebookUrl')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="https://facebook.com/…"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Biographie</label>
          <textarea
            rows={3}
            value={form.biography}
            onChange={handleChange('biography')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Présentation courte…"
          />
        </div>
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
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Enregistrement…' : 'Créer l’artiste'}
        </button>
      </div>
    </form>
  );
}
