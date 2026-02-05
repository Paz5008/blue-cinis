"use client";

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminModal from '../../_components/AdminModal';
import { useToast } from '@/context/ToastContext';
import { SensitiveConfirmDialog } from '@/components/admin/SensitiveConfirmDialog';

type EventRecord = {
  id: string;
  title: string;
  description?: string | null;
  date: string | Date | null;
  location?: string | null;
  imageUrl?: string | null;
};

type Props = {
  initialEvents: EventRecord[];
};

export default function EventsClient({ initialEvents }: Props) {
  const { addToast } = useToast();
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventRecord | null>(null);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const da = new Date(a.date ?? 0).getTime();
        const db = new Date(b.date ?? 0).getTime();
        return da - db;
      }),
    [events],
  );

  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((event) => new Date(event.date ?? 0).getTime() >= Date.now()).length;
    return [
      { label: 'Total', value: total },
      { label: 'À venir', value: upcoming },
      { label: 'Passés', value: Math.max(0, total - upcoming) },
    ];
  }, [events]);

  const handleCreated = (record: EventRecord) => {
    setEvents((current) => [...current, record]);
    addToast('Évènement ajouté avec succès.', 'success');
    setIsCreateModalOpen(false);
  };

  const handleDelete = (record: EventRecord) => {
    setDeleteTarget(record);
  };

  const confirmDeletion = async (_?: { mfaToken?: string | null }) => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/events/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Suppression impossible');
      }
      setEvents((current) => current.filter((event) => event.id !== deleteTarget.id));
      addToast('Évènement supprimé.', 'success');
      setDeleteTarget(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erreur inattendue';
      addToast(reason, 'error');
      throw new Error(reason);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Évènements</h1>
          <p className="text-sm text-slate-500">
            Publiez les vernissages, rencontres ou marchés d’artistes. Les créations et suppressions sont reflétées
            instantanément sur le site public.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Nouvel évènement
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sortedEvents.map((event) => {
          const occursAt = event.date ? new Date(event.date) : null;
          const isUpcoming = occursAt ? occursAt.getTime() >= Date.now() : false;
          return (
            <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                  {event.location && <p className="text-sm text-slate-500">{event.location}</p>}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isUpcoming ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isUpcoming ? 'À venir' : 'Passé'}
                </span>
              </div>
              <dl className="mt-4 space-y-1 text-sm text-slate-600">
                {occursAt && (
                  <div className="flex items-center justify-between">
                    <dt>Date</dt>
                    <dd>{occursAt.toLocaleString('fr-FR')}</dd>
                  </div>
                )}
                {event.description && (
                  <div className="text-slate-500">{truncate(event.description, 220)}</div>
                )}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/evenements/${event.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  target="_blank"
                  rel="noreferrer"
                >
                  Voir la page
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(event)}
                  disabled={deletingId === event.id}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {deletingId === event.id ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          );
        })}
        {sortedEvents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Aucun évènement pour le moment.
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <AdminModal
          title="Ajouter un évènement"
          description="Les visiteurs verront ces informations dès la publication."
          onClose={() => setIsCreateModalOpen(false)}
        >
          <CreateEventForm
            onCreated={handleCreated}
            onError={(message) => addToast(message, 'error')}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </AdminModal>
      )}
      <SensitiveConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Supprimer « ${deleteTarget.title} »` : 'Supprimer'}
        description="Les suppressions d’évènements sont journalisées et immédiates."
        scope="events.delete"
        requireMfa={false}
        confirmLabel="Supprimer"
        onConfirm={confirmDeletion}
        onDismiss={() => setDeleteTarget(null)}
        context={
          <p>
            L’évènement disparaîtra du calendrier public et des composants agenda. Aucun rappel automatique ne sera
            envoyé après suppression.
          </p>
        }
        metadata={
          deleteTarget
            ? [
                { label: 'Identifiant', value: deleteTarget.id },
                { label: 'Date', value: deleteTarget.date ? new Date(deleteTarget.date).toLocaleString('fr-FR') : '—' },
              ]
            : undefined
        }
      />
    </div>
  );
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

type CreateEventFormProps = {
  onCreated: (event: EventRecord) => void;
  onError: (message: string) => void;
  onCancel?: () => void;
};

function CreateEventForm({ onCreated, onError, onCancel }: CreateEventFormProps) {
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    imageUrl: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!form.title.trim()) {
      onError('Ajoutez un titre.');
      return;
    }
    if (!form.date) {
      onError('Sélectionnez une date.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        date: form.date,
      };
      if (form.location.trim()) payload.location = form.location.trim();
      if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Impossible de créer cet évènement');
      }
      const created = (await res.json()) as EventRecord;
      onCreated(created);
      setForm({ title: '', date: '', location: '', imageUrl: '', description: '' });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erreur inattendue';
      onError(reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Titre</label>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Ex : Vernissage Lumières de Loire"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Date & heure</label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Lieu</label>
          <input
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Nantes, Hôtel particulier…"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Image (URL)</label>
          <input
            value={form.imageUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="https://…"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Quelques mots sur le programme, les invités, etc."
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
          {submitting ? 'Enregistrement…' : 'Publier l’évènement'}
        </button>
      </div>
    </form>
  );
}
