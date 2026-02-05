"use client";

import { useEffect, useMemo, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LeadClientFiltersPreset, LeadSort } from "@/lib/adminFilters";
import { LeadFilterPreset } from "@/lib/adminFilters";
import {
  LEAD_STATUS_OPTIONS,
  type LeadWorkflowStatus,
  getLeadStatusLabel,
  type WorkflowActivityDTO,
} from "@/lib/workflows";
import type { AdminExportJobDTO } from "@/lib/adminExports";
import { useToast } from "@/context/ToastContext";
import { SensitiveConfirmDialog } from "@/components/admin/SensitiveConfirmDialog";
import { buildArtworkPath } from "@/lib/artworkSlug";

const statusColors: Record<LeadWorkflowStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-800",
  qualified: "bg-emerald-100 text-emerald-800",
  proposal: "bg-indigo-100 text-indigo-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-rose-100 text-rose-800",
};

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  message?: string | null;
  artworkId?: string | null;
  artistId?: string | null;
  createdAt: string;
  updatedAt: string;
  status: LeadWorkflowStatus;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  nextFollowUpNote?: string | null;
};

type LeadsResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Lead[];
  sensitiveMode?: "masked" | "full";
};

type Filters = {
  q: string;
  from: string;
  to: string;
  status: string;
  sort: LeadSort;
  showSensitive: boolean;
};

type Props = {
  data: LeadsResponse;
  filters: Filters;
};

type LeadDetailPayload = {
  lead: Lead;
  timeline: WorkflowActivityDTO[];
};

export default function LeadsClient({ data, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const [rows, setRows] = useState(data.items);
  const [listInfo, setListInfo] = useState(() => ({
    page: data.page,
    pageSize: data.pageSize,
    total: data.total,
    sensitiveMode: data.sensitiveMode,
  }));
  const [formState, setFormState] = useState(filters);
  const [isPending, startTransition] = useTransition();
  const [exportJobs, setExportJobs] = useState<AdminExportJobDTO[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<LeadDetailPayload | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelBusy, setPanelBusy] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [sensitiveDialogOpen, setSensitiveDialogOpen] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);


  useEffect(() => {
    setFormState(filters);
  }, [filters]);

  useEffect(() => {
    setRows(data.items);
    setListInfo({
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      sensitiveMode: data.sensitiveMode,
    });
  }, [data]);

  useEffect(() => {
    refreshExportJobs();
  }, []);

  useEffect(() => {
    if (formState.showSensitive && mfaToken) {
      fetchLeadsFromApi(true);
    }
  }, [data, formState.showSensitive, mfaToken]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((listInfo.total || 0) / (listInfo.pageSize || 20))),
    [listInfo.total, listInfo.pageSize],
  );

  const pushWithFilters = (overrides: Partial<Filters & { page?: number }>) => {
    const next: LeadClientFiltersPreset = {
      ...formState,
      ...overrides,
    };
    const page = overrides.page ?? listInfo.page ?? 1;
    const params = LeadFilterPreset.buildSearchParams(next, { page, pageSize: listInfo.pageSize });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const applyFilters = () => pushWithFilters({ page: 1 });

  const applySensitiveMode = (checked: boolean) => {
    setFormState((prev) => ({ ...prev, showSensitive: checked }));
    pushWithFilters({ page: 1, showSensitive: checked });
    if (selectedLeadId) {
      fetchLeadDetail(selectedLeadId, { silent: true, includeSensitive: checked });
    }
    addToast(
      checked ? "Coordonnées sensibles affichées. L’accès est journalisé." : "Coordonnées sensibles masquées.",
      checked ? "warning" : "info",
    );
  };

  const handleSensitiveToggle = (checked: boolean) => {
    if (checked && !formState.showSensitive) {
      setSensitiveDialogOpen(true);
      return;
    }
    if (!checked) {
      setMfaToken(null);
    }
    applySensitiveMode(checked);
  };

  const confirmSensitiveAccess = async (payload?: { mfaToken?: string | null }) => {
    if (payload?.mfaToken) {
      setMfaToken(payload.mfaToken);
    }
    applySensitiveMode(true);
    await fetchLeadsFromApi(true, payload?.mfaToken ?? null);
    setSensitiveDialogOpen(false);
  };

  const cancelSensitiveAccess = () => {
    setSensitiveDialogOpen(false);
  };

  const goToPage = (page: number) => pushWithFilters({ page });

  async function refreshExportJobs() {
    try {
      const res = await fetch(`/api/admin/exports?type=leads_csv`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { jobs: AdminExportJobDTO[] };
      setExportJobs(json.jobs ?? []);
    } catch {
      // ignore
    }
  }

  async function triggerExport() {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      const payload = {
        filters: {
          q: formState.q,
          from: formState.from,
          to: formState.to,
          status: formState.status,
          sort: formState.sort,
          showSensitive: formState.showSensitive,
        },
      };
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (formState.showSensitive && mfaToken) {
        headers["x-admin-mfa-token"] = mfaToken;
      }
      const res = await fetch("/api/admin/leads/export", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("export_failed");
      }
      const json = (await res.json()) as { job: AdminExportJobDTO };
      if (json.job) {
        setExportJobs((prev) => [json.job, ...prev].slice(0, 6));
        setTimeout(refreshExportJobs, 1500);
        addToast("Export CSV lancé. Vous serez notifié quand le fichier sera prêt.", "success");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de lancer l'export CSV.";
      addToast(message === "export_failed" ? "Impossible de lancer l'export CSV." : message, "error");
    } finally {
      setExportLoading(false);
    }
  }

  const fetchLeadsFromApi = async (
    includeSensitiveOverride?: boolean,
    tokenOverride?: string | null,
  ) => {
    const includeSensitive = includeSensitiveOverride ?? formState.showSensitive;
    const token = tokenOverride ?? mfaToken;
    const preset: LeadClientFiltersPreset = {
      ...formState,
      showSensitive: includeSensitive,
    };
    const params = LeadFilterPreset.buildSearchParams(preset, { page: listInfo.page, pageSize: listInfo.pageSize });
    try {

      const res = await fetch(`/api/admin/leads?${params.toString()}`, {
        cache: "no-store",
        headers: includeSensitive && token ? { "x-admin-mfa-token": token } : undefined,
      });
      if (!res.ok) {
        throw new Error("fetch_failed");
      }
      const payload = (await res.json()) as LeadsResponse;
      setRows(payload.items);
      setListInfo({
        page: payload.page,
        pageSize: payload.pageSize,
        total: payload.total,
        sensitiveMode: payload.sensitiveMode,
      });
      return payload;
    } catch {
      if (includeSensitive) {
        addToast("Impossible d'afficher les coordonnées complètes.", "error");
      }
      return null;
    } finally {

    }
  };

  const fetchLeadDetail = async (
    leadId: string,
    options?: { silent?: boolean; includeSensitive?: boolean },
  ) => {
    setPanelError(null);
    if (!options?.silent) {
      setPanelLoading(true);
      setPanelData(null);
    }
    try {
      const includeSensitive = options?.includeSensitive ?? formState.showSensitive;
      const query = includeSensitive ? "?sensitive=full" : "";
      const headers: Record<string, string> = {};
      if (includeSensitive && mfaToken) {
        headers["x-admin-mfa-token"] = mfaToken;
      }
      const res = await fetch(`/api/admin/leads/${leadId}${query}`, { cache: "no-store", headers });
      if (!res.ok) throw new Error("fetch_failed");
      const payload = (await res.json()) as LeadDetailPayload;
      setPanelData(payload);
      return payload;
    } catch {
      setPanelError("Impossible de charger la fiche.");
      return null;
    } finally {
      if (!options?.silent) {
        setPanelLoading(false);
      }
    }
  };

  const openLeadDrawer = async (lead: Lead) => {
    setSelectedLeadId(lead.id);
    await fetchLeadDetail(lead.id);
  };

  const closeLeadDrawer = () => {
    setSelectedLeadId(null);
    setPanelData(null);
    setPanelError(null);
    setPanelLoading(false);
    setPanelBusy(false);
  };

  const updateRowFromDetail = (lead: Lead) => {
    setRows((prev) => prev.map((row) => (row.id === lead.id ? { ...row, ...lead } : row)));
  };

  const runWorkflowAction = async (payload: Record<string, unknown>) => {
    if (!selectedLeadId) return false;
    setPanelBusy(true);
    setPanelError(null);
    try {
      const query = formState.showSensitive ? "?sensitive=full" : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (formState.showSensitive && mfaToken) {
        headers["x-admin-mfa-token"] = mfaToken;
      }
      const res = await fetch(`/api/admin/leads/${selectedLeadId}${query}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("action_failed");
      }
      const next = (await res.json()) as LeadDetailPayload;
      setPanelData(next);
      updateRowFromDetail(next.lead);
      return true;
    } catch {
      setPanelError("Action impossible, réessayez.");
      return false;
    } finally {
      setPanelBusy(false);
    }
  };

  const handleStatusChange = async (status: LeadWorkflowStatus) => {
    await runWorkflowAction({ intent: "status", status });
  };

  const handleNoteSubmit = async (content: string) => runWorkflowAction({ intent: "note", content });

  const handleFollowUpSubmit = async (summary: string, dueAtISO: string) =>
    runWorkflowAction({ intent: "follow_up", summary, dueAt: dueAtISO });

  const handleCompleteFollowUp = async (activityId: string) =>
    runWorkflowAction({ intent: "complete_follow_up", activityId });

  return (
    <div className="space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Leads</h1>
        <p className="text-sm text-slate-500">
          Analysez les demandes, assignez un statut commercial, planifiez vos relances et centralisez les notes internes.
        </p>
      </div>

      <FiltersBar
        formState={formState}
        setFormState={setFormState}
        onApply={applyFilters}
        onSensitiveToggle={handleSensitiveToggle}
        isPending={isPending}
        triggerExport={triggerExport}
        exportLoading={exportLoading}
      />

      <ExportJobsCard jobs={exportJobs} onRefresh={refreshExportJobs} />

      <TableView
        rows={rows}
        sensitiveMode={listInfo.sensitiveMode}
        info={listInfo}
        totalPages={totalPages}
        isPending={isPending}
        goToPage={goToPage}
        openLeadDrawer={openLeadDrawer}
      />

      <LeadWorkflowDrawer
        open={Boolean(selectedLeadId)}
        loading={panelLoading}
        busy={panelBusy}
        error={panelError}
        data={panelData}
        showSensitive={formState.showSensitive}
        onClose={closeLeadDrawer}
        onRefresh={() => selectedLeadId && fetchLeadDetail(selectedLeadId, { silent: true })}
        onStatusChange={handleStatusChange}
        onAddNote={handleNoteSubmit}
        onScheduleFollowUp={handleFollowUpSubmit}
        onCompleteFollowUp={handleCompleteFollowUp}
      />
      <SensitiveConfirmDialog
        open={sensitiveDialogOpen}
        title="Accéder aux coordonnées complètes"
        description="L’affichage des emails, téléphones et adresses est réservé aux opérations sensibles."
        scope="leads.sensitive-toggle"
        requireMfa
        confirmTone="primary"
        confirmLabel="Afficher les données"
        onConfirm={confirmSensitiveAccess}
        onDismiss={cancelSensitiveAccess}
        context={
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Chaque activation est journalisée avec votre identité et vos filtres.</li>
            <li>Pensez à repasser en mode masqué après vérification.</li>
          </ul>
        }
        metadata={[
          { label: "Recherche active", value: formState.q ? formState.q : "Aucune" },
          { label: "Statut pipeline", value: formState.status || "Tous" },
        ]}
      />
    </div>
  );
}

type FiltersBarProps = {
  formState: Filters;
  setFormState: Dispatch<SetStateAction<Filters>>;
  onApply: () => void;
  onSensitiveToggle: (checked: boolean) => void;
  isPending: boolean;
  triggerExport: () => void;
  exportLoading: boolean;
};

function FiltersBar({ formState, setFormState, onApply, onSensitiveToggle, isPending, triggerExport, exportLoading }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Recherche</label>
        <input
          value={formState.q}
          onChange={(event) => setFormState((prev) => ({ ...prev, q: event.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="nom, email, message"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Statut</label>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          value={formState.status}
          onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
        >
          <option value="">Tous</option>
          {LEAD_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Tri</label>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          value={formState.sort}
          onChange={(event) => setFormState((prev) => ({ ...prev, sort: event.target.value as LeadSort }))}
        >
          <option value="createdAt_desc">Date desc</option>
          <option value="createdAt_asc">Date asc</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Du</label>
        <input
          type="date"
          value={formState.from}
          onChange={(event) => setFormState((prev) => ({ ...prev, from: event.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Au</label>
        <input
          type="date"
          value={formState.to}
          onChange={(event) => setFormState((prev) => ({ ...prev, to: event.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>
      <button
        onClick={onApply}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
      >
        Appliquer
      </button>
      <button
        onClick={triggerExport}
        disabled={exportLoading}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
      >
        {exportLoading ? "Préparation…" : "Exporter CSV"}
      </button>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={formState.showSensitive}
          onChange={(event) => onSensitiveToggle(event.target.checked)}
        />
        Afficher emails/téléphones
      </label>
    </div>
  );
}

type TableViewProps = {
  rows: Lead[];
  sensitiveMode?: "masked" | "full";
  info: { page: number };
  totalPages: number;
  isPending: boolean;
  goToPage: (page: number) => void;
  openLeadDrawer: (lead: Lead) => void;
};

function TableView({ rows, sensitiveMode, info, totalPages, isPending, goToPage, openLeadDrawer }: TableViewProps) {
  return (
    <>
      {sensitiveMode !== "full" && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Les données sensibles sont masquées par défaut. Activez l’option ci-dessus pour les révéler (action journalisée).
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Relance</th>
              <th className="px-4 py-3">Œuvre</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((lead) => (
              <tr key={lead.id} className="align-top">
                <td className="px-4 py-3 text-slate-600">{formatDate(lead.createdAt)}</td>
                <td className="px-4 py-3">{lead.name}</td>
                <td className="px-4 py-3">{lead.email}</td>
                <td className="px-4 py-3">{lead.phone || "-"}</td>
                <td className="px-4 py-3">
                  <LeadStatusBadge value={lead.status} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {lead.nextFollowUpAt ? (
                    <div>
                      <p>{formatDate(lead.nextFollowUpAt)}</p>
                      {lead.nextFollowUpNote && <p className="text-slate-500">{lead.nextFollowUpNote}</p>}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-blue-700 underline">
                  {lead.artworkId ? (
                    <a
                      href={buildArtworkPath({ id: lead.artworkId, title: (lead as any).artworkTitle })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {lead.artworkId}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{lead.message || ""}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openLeadDrawer(lead)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50"
                  >
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                  Aucun lead pour ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        <button
          disabled={info.page <= 1 || isPending}
          onClick={() => goToPage(info.page - 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          Précédent
        </button>
        <span>
          Page {info.page} / {totalPages}
        </span>
        <button
          disabled={info.page >= totalPages || isPending}
          onClick={() => goToPage(info.page + 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </>
  );
}

type ExportJobsCardProps = {
  jobs: AdminExportJobDTO[];
  onRefresh: () => void;
};

function ExportJobsCard({ jobs, onRefresh }: ExportJobsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exports récents</p>
          <p className="text-sm text-slate-500">Suivez la génération asynchrone des CSV leads.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Rafraîchir
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {jobs.length === 0 && <p className="text-sm text-slate-500">Aucun export déclenché récemment.</p>}
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-slate-900">{job.fileName || job.type}</p>
              <p className="text-xs text-slate-500">{formatDate(job.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={exportStatusClass(job.status)}>{job.status}</span>
              {job.downloadUrl && (
                <a
                  href={job.downloadUrl}
                  className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Télécharger
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type LeadWorkflowDrawerProps = {
  open: boolean;
  data: LeadDetailPayload | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  showSensitive: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onStatusChange: (status: LeadWorkflowStatus) => void;
  onAddNote: (content: string) => Promise<boolean | void> | void;
  onScheduleFollowUp: (summary: string, dueAtISO: string) => Promise<boolean | void> | void;
  onCompleteFollowUp: (activityId: string) => Promise<boolean | void> | void;
};

function LeadWorkflowDrawer({
  open,
  data,
  loading,
  busy,
  error,
  showSensitive,
  onClose,
  onRefresh,
  onStatusChange,
  onAddNote,
  onScheduleFollowUp,
  onCompleteFollowUp,
}: LeadWorkflowDrawerProps) {
  const [note, setNote] = useState("");
  const [followUpSummary, setFollowUpSummary] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    if (!open) {
      setNote("");
      setFollowUpSummary("");
      setFollowUpDate("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/40" onClick={onClose} />
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead</p>
            <h2 className="text-xl font-semibold text-slate-900">{data?.lead.name ?? "—"}</h2>
            {data?.lead.email && (
              <a className="text-xs text-blue-600 underline" href={`mailto:${data.lead.email}`}>
                {data.lead.email}
              </a>
            )}
            {!showSensitive && <p className="text-[11px] text-amber-600">Données sensibles masquées</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Actualiser
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {loading && <p className="text-sm text-slate-500">Chargement…</p>}
          {error && !loading && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {!loading && data && (
            <>
              <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statut pipeline</p>
                    <p className="text-sm text-slate-500">
                      Dernière mise à jour le {formatDate(data.lead.updatedAt)}.
                    </p>
                  </div>
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={data.lead.status}
                    disabled={busy}
                    onChange={(event) => onStatusChange(event.target.value as LeadWorkflowStatus)}
                  >
                    {LEAD_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Dernier contact: {data.lead.lastContactedAt ? formatDate(data.lead.lastContactedAt) : "—"}
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Prochaine relance: {data.lead.nextFollowUpAt ? formatDate(data.lead.nextFollowUpAt) : "non planifiée"}
                  {data.lead.nextFollowUpNote && <p className="text-xs text-slate-500">{data.lead.nextFollowUpNote}</p>}
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Programmer une relance</p>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={busy}
                />
                <textarea
                  value={followUpSummary}
                  onChange={(event) => setFollowUpSummary(event.target.value)}
                  rows={2}
                  placeholder="Ex: Relancer avec proposition commerciale"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={busy}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (!followUpDate || !followUpSummary.trim()) {
                        addToast("Renseignez la date et un résumé avant de planifier.", "error");
                        return;
                      }
                      const iso = new Date(followUpDate).toISOString();
                      const ok = await onScheduleFollowUp(followUpSummary.trim(), iso);
                      if (ok !== false) {
                        setFollowUpSummary("");
                        setFollowUpDate("");
                      }
                    }}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {busy ? "Enregistrement…" : "Planifier"}
                  </button>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ajouter une note</p>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Compte-rendu d’appel, objection, besoin…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={busy}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={busy || note.trim().length < 3}
                    onClick={async () => {
                      const ok = await onAddNote(note.trim());
                      if (ok !== false) {
                        setNote("");
                      }
                    }}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {busy ? "Ajout…" : "Enregistrer"}
                  </button>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
                  <p className="text-xs text-slate-500">Notes, changements de statut et relances planifiées.</p>
                </div>
                <div className="space-y-3">
                  {data.timeline.map((entry) => (
                    <TimelineEntry
                      key={entry.id}
                      entry={entry}
                      busy={busy}
                      onComplete={() => onCompleteFollowUp(entry.id)}
                    />
                  ))}
                  {data.timeline.length === 0 && <p className="text-sm text-slate-500">Aucune activité pour l’instant.</p>}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type TimelineEntryProps = {
  entry: WorkflowActivityDTO;
  busy: boolean;
  onComplete: () => void;
};

function TimelineEntry({ entry, busy, onComplete }: TimelineEntryProps) {
  const isFollowUp = entry.activityType === "follow_up";
  const done = Boolean(entry.completedAt);
  const overdue = isFollowUp && !done && entry.dueAt ? new Date(entry.dueAt).getTime() < Date.now() : false;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formatDate(entry.createdAt)}</span>
        <span className="font-semibold uppercase tracking-wide">{entry.activityType}</span>
      </div>
      <div className="mt-1 text-slate-900">{describeActivity(entry)}</div>
      {isFollowUp && (
        <div className="mt-2 text-xs text-slate-500">
          Prévu le {entry.dueAt ? formatDate(entry.dueAt) : "—"}
          {overdue && <span className="ml-2 text-rose-600">(en retard)</span>}
        </div>
      )}
      {entry.activityType === "note" && entry.authorEmail && (
        <div className="mt-1 text-xs text-slate-500">par {entry.authorEmail}</div>
      )}
      {isFollowUp && !done && (
        <div className="mt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onComplete}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-50"
          >
            Marquer comme traité
          </button>
        </div>
      )}
      {done && <p className="mt-2 text-xs text-emerald-600">Traité le {entry.completedAt ? formatDate(entry.completedAt) : "—"}</p>}
    </div>
  );
}

function LeadStatusBadge({ value }: { value: LeadWorkflowStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[value]}`}>{getLeadStatusLabel(value)}</span>
  );
}

function exportStatusClass(status: string) {
  if (status === "ready") return "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800";
  if (status === "error") return "rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800";
  return "rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700";
}

function describeActivity(entry: WorkflowActivityDTO) {
  if (entry.activityType === "status") {
    const status = typeof entry.payload?.status === "string" ? (entry.payload.status as LeadWorkflowStatus) : undefined;
    return `Statut → ${status ? getLeadStatusLabel(status) : "—"}`;
  }
  if (entry.activityType === "note") {
    return (entry.payload?.content as string) || "Note interne";
  }
  if (entry.activityType === "follow_up") {
    return entry.payload?.summary ? String(entry.payload.summary) : "Relance programmée";
  }
  return "Action";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}
