import { auth } from '@/auth';
import type { Session } from 'next-auth';
import type { Lead, LeadStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureArtistProfile } from '@/lib/artist-profile';
import { revalidatePath } from 'next/cache';
import { LEAD_STATUS_OPTIONS, type LeadWorkflowStatus, getLeadStatusLabel } from '@/lib/workflows';

const ALLOWED_LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

async function updateLeadAction(formData: FormData) {
  'use server';
  const session = await auth();
  // Safe check for role without any cast if possible, or keep explicit cast but minimal
  // Using explicit cast for now as ClientLayout also uses it, but will fix strictness if I can.
  // Actually, for server actions, session.user is usually correctly typed if extended, but here it seems strict.
  // I will just leave the role check as is in server action if it works, or fix it if I replace the whole block.
  // The instruction focus is on `leads` variable.
  if (!session || (session.user as any).role !== 'artist') {
    throw new Error('Unauthorized');
  }
  const leadId = formData.get('leadId');
  const intent = formData.get('intent');
  if (typeof leadId !== 'string' || !leadId || typeof intent !== 'string') {
    return;
  }
  const artist = await ensureArtistProfile(session as Session, { select: { id: true } });
  if (!artist) return;
  const where = { id: leadId, artistId: artist.id };
  const now = new Date();

  try {
    if (intent === 'status') {
      const statusValue = formData.get('status');
      const note = formData.get('note');
      const data: Prisma.LeadUpdateInput = {};
      if (typeof statusValue === 'string' && statusValue) {
        const status = ALLOWED_LEAD_STATUSES.find((value) => value === statusValue);
        if (status) {
          data.status = status;
        }
      }
      data.nextFollowUpNote =
        typeof note === 'string' && note.trim().length
          ? note.trim().slice(0, 500)
          : null;
      await prisma.lead.update({ where, data });
    } else if (intent === 'contacted') {
      await prisma.lead.update({ where, data: { lastContactedAt: now } });
    } else if (intent === 'followup') {
      const followUpDate = formData.get('followUpDate');
      if (typeof followUpDate === 'string' && followUpDate) {
        const date = new Date(followUpDate);
        if (!Number.isNaN(date.getTime())) {
          await prisma.lead.update({ where, data: { nextFollowUpAt: date } });
        }
      }
    }
  } finally {
    revalidatePath('/dashboard-artist/leads');
  }
}

export default async function ArtistLeadsPage() {
  const session = await auth();
  if (!session || (session.user as any).role !== 'artist') {
    return <section className="p-8"><p>Non autorisé.</p></section>;
  }
  const artist = await ensureArtistProfile(session as Session);
  if (!artist) return <section className="p-8"><p>Profil artiste introuvable.</p></section>;
  let leads: Lead[] = [];
  try {
    leads = await prisma.lead.findMany({ where: { artistId: artist.id }, orderBy: { createdAt: 'desc' } });
  } catch {
    return (
      <section className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Demandes d’achat</h1>
        <p className="text-sm text-gray-600">La fonctionnalité de demandes d’achat n’est pas disponible sur cette instance (table Lead manquante).</p>
      </section>
    );
  }

  const artworkIds = Array.from(new Set(leads.map(l => l.artworkId).filter(Boolean) as string[]));
  const artworks = await prisma.artwork.findMany({ where: { id: { in: artworkIds } } });
  const artById = new Map(artworks.map(a => [a.id, a] as const));
  return (
    <section className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white">Demandes d’achat</h1>
          <p className="text-white/60 mt-1">Gérez les demandes entrantes et suivez vos prospects.</p>
        </div>
        <a href="/api/artist/leads/export" className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 transition-colors">
          Exporter en CSV
        </a>
      </div>

      {leads.length === 0 ? (
        <div className="p-12 text-center border border-white/10 bg-white/5 rounded-xl">
          <p className="text-white/40">Aucune demande pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-white/5 text-white/40 uppercase tracking-wider text-xs font-medium">
              <tr>
                <th className="py-3 px-4 font-normal">Date</th>
                <th className="py-3 px-4 font-normal">Prospect</th>
                <th className="py-3 px-4 font-normal">Contact</th>
                <th className="py-3 px-4 font-normal">Œuvre</th>
                <th className="py-3 px-4 font-normal">Suivi</th>
                <th className="py-3 px-4 font-normal w-64">Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {leads.map((l) => {
                const artwork = l.artworkId ? artById.get(l.artworkId) : null;
                const statusLabel = getLeadStatusLabel(l.status as LeadWorkflowStatus);
                const lastContact = l.lastContactedAt ? new Date(l.lastContactedAt).toLocaleDateString('fr-FR') : null;
                const nextFollowUp = l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toLocaleDateString('fr-FR') : null;
                const nextFollowUpIso = l.nextFollowUpAt
                  ? new Date(l.nextFollowUpAt).toISOString().slice(0, 16)
                  : '';
                return (
                  <tr key={l.id} className="group hover:bg-white/5 transition-colors align-top">
                    <td className="py-4 px-4 text-xs text-white/50">{new Date(l.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-white">{l.name}</p>
                      {l.message ? (
                        <p className="mt-1 text-xs text-white/50 bg-white/5 p-2 rounded border border-white/5 italic">"{l.message}"</p>
                      ) : (
                        <p className="text-xs text-white/30 italic">Aucun message</p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 text-sm">
                        {l.email ? (
                          <a href={`mailto:${l.email}`} className="text-white/70 hover:text-white underline decoration-white/30 transition-colors">
                            {l.email}
                          </a>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                        {l.phone ? (
                          <a href={`tel:${l.phone}`} className="text-white/70 hover:text-white underline decoration-white/30 transition-colors">
                            {l.phone}
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {artwork ? (
                        <div>
                          <p className="font-medium text-white">{artwork.title}</p>
                          <p className="text-xs text-white/40">{l.artworkId}</p>
                        </div>
                      ) : (
                        <span className="text-white/30">{l.artworkId || '-'}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${l.status === 'new' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                        l.status === 'won' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                          'bg-white/10 text-white/70 border-white/10'
                        }`}>
                        {statusLabel || l.status}
                      </span>
                      <div className="mt-3 space-y-1 text-xs text-white/50">
                        {lastContact ? <p>Contacté le {lastContact}</p> : <p>Jamais contacté</p>}
                        {nextFollowUp ? <p className="text-amber-200/80">📞 Rappel le {nextFollowUp}</p> : <p>Aucun rappel</p>}
                        {l.nextFollowUpNote ? <p className="text-white/40 italic border-l-2 border-white/10 pl-2 mt-1">{l.nextFollowUpNote}</p> : null}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-3">
                        <form action={updateLeadAction} className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                          <input type="hidden" name="intent" value="status" />
                          <input type="hidden" name="leadId" value={l.id} />
                          <label className="block text-[10px] uppercase tracking-wide text-white/40 font-semibold">
                            Statut
                            <select name="status" defaultValue={l.status} className="mt-1 w-full rounded bg-black/50 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30">
                              {LEAD_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-[10px] uppercase tracking-wide text-white/40 font-semibold">
                            Note interne
                            <textarea
                              name="note"
                              defaultValue={l.nextFollowUpNote || ''}
                              rows={2}
                              className="mt-1 w-full rounded bg-black/50 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30"
                              placeholder="Notes..."
                            />
                          </label>
                          <button type="submit" className="w-full rounded bg-white/10 hover:bg-white/20 px-2 py-1.5 text-xs text-white transition-colors border border-white/5">
                            Mettre à jour
                          </button>
                        </form>

                        <div className="grid grid-cols-1 gap-2">
                          <form action={updateLeadAction}>
                            <input type="hidden" name="intent" value="contacted" />
                            <input type="hidden" name="leadId" value={l.id} />
                            <button type="submit" className="w-full rounded border border-white/10 hover:bg-white/5 px-2 py-1 text-xs text-white/60 hover:text-white transition-colors">
                              Marquer contacté
                            </button>
                          </form>

                          <form action={updateLeadAction} className="p-2 border border-white/5 rounded bg-white/5">
                            <input type="hidden" name="intent" value="followup" />
                            <input type="hidden" name="leadId" value={l.id} />
                            <label className="block text-[10px] uppercase tracking-wide text-white/40 font-semibold mb-1">
                              Planifier rappel
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="datetime-local"
                                name="followUpDate"
                                defaultValue={nextFollowUpIso}
                                className="w-full rounded bg-black/50 border border-white/10 px-1 py-1 text-[10px] text-white focus:outline-none"
                              />
                              <button type="submit" className="rounded bg-white text-black px-2 py-1 text-xs hover:bg-white/90">
                                Ok
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
