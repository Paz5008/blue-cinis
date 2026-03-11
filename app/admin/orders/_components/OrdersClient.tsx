"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { OrderClientFiltersPreset, OrderSort } from "@/lib/adminFilters";
import { OrderFilterPreset } from "@/lib/adminFilters";
import {
  ORDER_OPS_STATUS_OPTIONS,
  type OrderOpsStatus,
  getOrderOpsStatusLabel,
  type WorkflowActivityDTO,
} from "@/lib/workflows";
import type { AdminExportJobDTO } from "@/lib/adminExports";
import { useMfaChallenge } from "@/hooks/useMfaChallenge";
import { useToast } from "@/context/ToastContext";
import { SensitiveConfirmDialog } from "@/components/admin/SensitiveConfirmDialog";
import { buildArtworkPath } from "@/lib/artworkSlug";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  refunded: "bg-yellow-100 text-yellow-800",
  disputed: "bg-rose-100 text-rose-800",
  failed: "bg-slate-200 text-slate-700",
};

const OPS_STATUS_COLORS: Record<OrderOpsStatus, string> = {
  backoffice_pending: "bg-slate-100 text-slate-700",
  awaiting_payment: "bg-amber-100 text-amber-800",
  to_ship: "bg-indigo-100 text-indigo-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  blocked: "bg-rose-100 text-rose-800",
};

type Order = {
  id: string;
  artworkId: string;
  artworkTitle?: string | null;
  artistId: string;
  buyerEmail?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  amount: number;
  currency: string;
  fee: number;
  tax: number;
  shipping: number;
  net: number;
  stripeSessionId: string;
  paymentIntentId?: string | null;
  status: string;
  opsStatus: OrderOpsStatus;
  fulfillmentStatus: string;
  fulfilledAt?: string | null;
  billingAddress?: any;
  shippingAddress?: any;
  createdAt: string;
  shippingAddressPresent?: boolean;
  billingAddressPresent?: boolean;
  nextActionAt?: string | null;
  nextActionNote?: string | null;
};

type OrdersResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Order[];
  sensitiveMode?: "masked" | "full";
};

type Filters = {
  q: string;
  status: string;
  opsStatus: string;
  fulfillment: string;
  from: string;
  to: string;
  sort: OrderSort;
  showSensitive: boolean;
};

type Props = {
  data: OrdersResponse;
  filters: Filters;
  initialExportJobs: AdminExportJobDTO[];
};

type OrderDetailPayload = {
  order: Order;
  timeline: WorkflowActivityDTO[];
};

export default function OrdersClient({ data, filters, initialExportJobs }: Props) {
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [formState, setFormState] = useState(filters);
  const [isPending, startTransition] = useTransition();
  const [exportJobs, setExportJobs] = useState<AdminExportJobDTO[]>(initialExportJobs);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<OrderDetailPayload | null>(null);
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
    if (formState.showSensitive && mfaToken) {
      fetchOrdersFromApi(true);
    }
  }, [data, formState.showSensitive, mfaToken]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((listInfo.total || 0) / (listInfo.pageSize || 20))),
    [listInfo.total, listInfo.pageSize],
  );

  const pushWithFilters = (overrides: Partial<Filters & { page?: number }>) => {
    const next: OrderClientFiltersPreset = {
      ...formState,
      ...overrides,
    };
    const page = overrides.page ?? listInfo.page ?? 1;
    const params = OrderFilterPreset.buildSearchParams(next, { page, pageSize: listInfo.pageSize });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const applyFilters = () => pushWithFilters({ page: 1 });

  const applySensitiveMode = (checked: boolean) => {
    setFormState((prev) => ({ ...prev, showSensitive: checked }));
    pushWithFilters({ page: 1, showSensitive: checked });
    if (selectedOrderId) {
      fetchOrderDetail(selectedOrderId, { silent: true, includeSensitive: checked });
    }
    addToast(
      checked ? "Données sensibles affichées. Cette action est journalisée." : "Mode masqué réactivé.",
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
    await fetchOrdersFromApi(true, payload?.mfaToken ?? null);
    setSensitiveDialogOpen(false);
  };

  const cancelSensitiveAccess = () => setSensitiveDialogOpen(false);

  const goToPage = (page: number) => pushWithFilters({ page });

  const handleRefundRequest = (order: Order) => {
    setRefundTarget(order);
  };

  async function refreshExportJobs() {
    try {
      const res = await fetch(`/api/admin/exports?type=orders_csv`, { cache: "no-store" });
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
          status: formState.status,
          opsStatus: formState.opsStatus,
          fulfillment: formState.fulfillment,
          from: formState.from,
          to: formState.to,
          sort: formState.sort,
          showSensitive: formState.showSensitive,
        },
      };
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (formState.showSensitive && mfaToken) {
        headers["x-admin-mfa-token"] = mfaToken;
      }
      const res = await fetch("/api/admin/orders/export", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("export_failed");
      const json = (await res.json()) as { job: AdminExportJobDTO };
      if (json.job) {
        setExportJobs((prev) => [json.job, ...prev].slice(0, 6));
        setTimeout(refreshExportJobs, 1500);
        addToast("Export commandes lancé. Consultez l’historique ci-dessous.", "success");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de lancer l'export CSV des commandes.";
      addToast(message === "export_failed" ? "Impossible de lancer l'export CSV des commandes." : message, "error");
    } finally {
      setExportLoading(false);
    }
  }

  const fetchOrdersFromApi = async (
    includeSensitiveOverride?: boolean,
    tokenOverride?: string | null,
  ) => {
    const includeSensitive = includeSensitiveOverride ?? formState.showSensitive;
    const token = tokenOverride ?? mfaToken;
    const preset: OrderClientFiltersPreset = {
      ...formState,
      showSensitive: includeSensitive,
    };
    const params = OrderFilterPreset.buildSearchParams(preset, {
      page: listInfo.page,
      pageSize: listInfo.pageSize,
    });
    try {

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
        headers: includeSensitive && token ? { "x-admin-mfa-token": token } : undefined,
      });
      if (!res.ok) {
        throw new Error("fetch_failed");
      }
      const payload = (await res.json()) as OrdersResponse;
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
        addToast("Impossible d'afficher les données sensibles.", "error");
      }
      return null;
    } finally {

    }
  };

  const fetchOrderDetail = async (
    orderId: string,
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
      const res = await fetch(`/api/admin/orders/${orderId}${query}`, {
        cache: "no-store",
        headers,
      });
      if (!res.ok) throw new Error("fetch_failed");
      const payload = (await res.json()) as OrderDetailPayload;
      setPanelData(payload);
      return payload;
    } catch {
      setPanelError("Impossible de charger la commande.");
      return null;
    } finally {
      if (!options?.silent) {
        setPanelLoading(false);
      }
    }
  };

  const openOrderDrawer = async (order: Order) => {
    setSelectedOrderId(order.id);
    await fetchOrderDetail(order.id);
  };

  const closeOrderDrawer = () => {
    setSelectedOrderId(null);
    setPanelData(null);
    setPanelLoading(false);
    setPanelBusy(false);
    setPanelError(null);
  };

  const updateRowFromDetail = (order: Order) => {
    setRows((prev) => prev.map((row) => (row.id === order.id ? { ...row, ...order } : row)));
  };

  const runOrderWorkflowAction = async (payload: Record<string, unknown>) => {
    if (!selectedOrderId) return false;
    setPanelBusy(true);
    setPanelError(null);
    try {
      const query = formState.showSensitive ? "?sensitive=full" : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (formState.showSensitive && mfaToken) {
        headers["x-admin-mfa-token"] = mfaToken;
      }
      const res = await fetch(`/api/admin/orders/${selectedOrderId}${query}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("action_failed");
      }
      const next = (await res.json()) as OrderDetailPayload;
      setPanelData(next);
      updateRowFromDetail(next.order);
      return true;
    } catch {
      setPanelError("Action impossible, réessayez.");
      return false;
    } finally {
      setPanelBusy(false);
    }
  };

  const handleOpsStatusChange = async (status: OrderOpsStatus) => runOrderWorkflowAction({ intent: "ops_status", status });

  const handleOrderNote = async (content: string) => runOrderWorkflowAction({ intent: "note", content });

  const handleOrderFollowUp = async (summary: string, dueAtISO: string) =>
    runOrderWorkflowAction({ intent: "follow_up", summary, dueAt: dueAtISO });

  const handleCompleteFollowUp = async (activityId: string) =>
    runOrderWorkflowAction({ intent: "complete_follow_up", activityId });

  return (
    <>
      <div className="space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Commandes</h1>
          <p className="text-sm text-slate-500">
            Visualisez les flux financiers, affinez par statut ou période et suivez l’état logistique de chaque commande.
          </p>
        </div>

        <OrdersFilters
          formState={formState}
          setFormState={setFormState}
          isPending={isPending}
          onApply={applyFilters}
          onSensitiveToggle={handleSensitiveToggle}
          exportLoading={exportLoading}
          triggerExport={triggerExport}
        />

        <ExportJobsPanel
          title="Exports commandes"
          description="Suivi des fichiers CSV générés en tâche de fond."
          jobs={exportJobs}
          onRefresh={refreshExportJobs}
        />

        <OrdersTable
          rows={rows}
          info={listInfo}
          totalPages={totalPages}
          isPending={isPending}
          goToPage={goToPage}
          expanded={expanded}
          setExpanded={setExpanded}
          handleRefundRequest={handleRefundRequest}
          openOrderDrawer={openOrderDrawer}
          refreshList={() => router.refresh()}
        />
      </div>

      {refundTarget && (
        <RefundDialog
          order={refundTarget}
          onClose={() => setRefundTarget(null)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      <OrderWorkflowDrawer
        open={Boolean(selectedOrderId)}
        loading={panelLoading}
        busy={panelBusy}
        error={panelError}
        data={panelData}
        onClose={closeOrderDrawer}
        onRefresh={() => selectedOrderId && fetchOrderDetail(selectedOrderId, { silent: true })}
        onStatusChange={handleOpsStatusChange}
        onAddNote={handleOrderNote}
        onScheduleFollowUp={handleOrderFollowUp}
        onCompleteFollowUp={handleCompleteFollowUp}
      />
      <SensitiveConfirmDialog
        open={sensitiveDialogOpen}
        title="Accès aux coordonnées clients"
        description="Les emails, téléphones et adresses apparaîtront en clair dans les tableaux et fiches."
        scope="orders.sensitive-toggle"
        requireMfa
        confirmTone="primary"
        confirmLabel="Afficher les données"
        onConfirm={confirmSensitiveAccess}
        onDismiss={cancelSensitiveAccess}
        context={
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>L’accès est journalisé avec votre identifiant et les filtres actifs.</li>
            <li>Refermez le mode sensible dès que la vérification est terminée.</li>
          </ul>
        }
        metadata={[
          { label: "Recherche libre", value: formState.q || "Aucune" },
          { label: "Statut commande", value: formState.status || "Tous" },
          { label: "Statut ops", value: formState.opsStatus || "Tous" },
        ]}
      />
    </>
  );
}

type OrdersFiltersProps = {
  formState: Filters;
  setFormState: Dispatch<SetStateAction<Filters>>;
  isPending: boolean;
  onApply: () => void;
  onSensitiveToggle: (checked: boolean) => void;
  exportLoading: boolean;
  triggerExport: () => void;
};

function OrdersFilters({
  formState,
  setFormState,
  isPending,
  onApply,
  onSensitiveToggle,
  exportLoading,
  triggerExport,
}: OrdersFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Rechercher</label>
        <input
          type="search"
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          value={formState.q}
          onChange={(event) => setFormState((prev) => ({ ...prev, q: event.target.value }))}
          placeholder="ID, email, œuvre…"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Statut paiement</label>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          value={formState.status}
          onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
        >
          <option value="">Tous</option>
          <option value="paid">payé</option>
          <option value="refunded">remboursé</option>
          <option value="disputed">litige</option>
          <option value="failed">échec</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Workflow interne</label>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          value={formState.opsStatus}
          onChange={(event) => setFormState((prev) => ({ ...prev, opsStatus: event.target.value }))}
        >
          <option value="">Tous</option>
          {ORDER_OPS_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Fulfillment</label>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          value={formState.fulfillment}
          onChange={(event) => setFormState((prev) => ({ ...prev, fulfillment: event.target.value }))}
        >
          <option value="">Tous</option>
          <option value="pending_shipment">à expédier</option>
          <option value="shipped">expédié</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Tri</label>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          value={formState.sort}
          onChange={(event) => setFormState((prev) => ({ ...prev, sort: event.target.value as OrderSort }))}
        >
          <option value="createdAt_desc">Date desc</option>
          <option value="createdAt_asc">Date asc</option>
          <option value="amount_desc">Montant desc</option>
          <option value="amount_asc">Montant asc</option>
          <option value="net_desc">Net desc</option>
          <option value="net_asc">Net asc</option>
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
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {exportLoading ? "Préparation…" : "Exporter CSV"}
      </button>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={formState.showSensitive} onChange={(event) => onSensitiveToggle(event.target.checked)} />
        Afficher données sensibles
      </label>
    </div>
  );
}

type ExportJobsPanelProps = {
  title: string;
  description: string;
  jobs: AdminExportJobDTO[];
  onRefresh: () => void;
};

function ExportJobsPanel({ title, description, jobs, onRefresh }: ExportJobsPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-sm text-slate-500">{description}</p>
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
        {jobs.length === 0 && <p className="text-sm text-slate-500">Aucun export récent.</p>}
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

type OrdersTableProps = {
  rows: Order[];
  info: { page: number; pageSize: number; sensitiveMode?: "masked" | "full" };
  totalPages: number;
  isPending: boolean;
  goToPage: (page: number) => void;
  expanded: Record<string, boolean>;
  setExpanded: Dispatch<SetStateAction<Record<string, boolean>>>;
  handleRefundRequest: (order: Order) => void;
  openOrderDrawer: (order: Order) => void;
  refreshList: () => void;
};

function OrdersTable({ rows, info, totalPages, isPending, goToPage, expanded, setExpanded, handleRefundRequest, openOrderDrawer, refreshList }: OrdersTableProps) {
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Taxe</th>
              <th className="px-4 py-3">Frais port</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Acheteur</th>
              <th className="px-4 py-3">Artwork</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Stripe</th>
              <th className="px-4 py-3">Détails</th>
              <th className="px-4 py-3">Workflow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((order) => (
              <FragmentRow
                key={order.id}
                order={order}
                expanded={!!expanded[order.id]}
                onToggle={() => setExpanded((prev) => ({ ...prev, [order.id]: !prev[order.id] }))}
                refresh={refreshList}
                sensitiveMode={info.sensitiveMode}
                onRequestRefund={handleRefundRequest}
                openWorkflow={() => openOrderDrawer(order)}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-sm text-slate-500">
                  Aucune commande ne correspond à ces critères.
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

function FragmentRow({
  order,
  expanded,
  onToggle,
  refresh,
  sensitiveMode,
  onRequestRefund,
  openWorkflow,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  refresh: () => void;
  sensitiveMode?: "masked" | "full";
  onRequestRefund?: (order: Order) => void;
  openWorkflow: () => void;
}) {
  const refundable = order.status === "paid" || order.status === "disputed";
  const canRevealContact = sensitiveMode === "full";
  return (
    <>
      <tr className="align-top">
        <td className="px-4 py-3 text-slate-600">{formatDate(order.createdAt)}</td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-2">
            <StatusBadge value={order.status} />
            {refundable && onRequestRefund && (
              <button
                type="button"
                onClick={() => onRequestRefund(order)}
                className="text-left text-xs font-medium text-red-700 underline hover:text-red-800"
              >
                Rembourser
              </button>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1 text-xs text-slate-600">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${OPS_STATUS_COLORS[order.opsStatus]}`}>
              {getOrderOpsStatusLabel(order.opsStatus)}
            </span>
            {order.nextActionAt ? (
              <span>Prochaine action {formatDate(order.nextActionAt)}</span>
            ) : (
              <span className="text-slate-400">Aucune action planifiée</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">{formatAmount(order.amount, order.currency)}</td>
        <td className="px-4 py-3">{formatAmount(order.tax, order.currency)}</td>
        <td className="px-4 py-3">{formatAmount(order.shipping, order.currency)}</td>
        <td className="px-4 py-3">{formatAmount(order.fee, order.currency)}</td>
        <td className="px-4 py-3">{formatAmount(order.net, order.currency)}</td>
        <td className="px-4 py-3">
          {order.buyerEmail ? (
            canRevealContact ? (
              <a className="text-blue-700 underline" href={`mailto:${order.buyerEmail}`}>
                {order.buyerEmail}
              </a>
            ) : (
              <span className="text-slate-600">{order.buyerEmail}</span>
            )
          ) : (
            order.buyerName || "-"
          )}
        </td>
        <td className="px-4 py-3 text-xs text-blue-700 underline">
          <a
            href={buildArtworkPath({ id: order.artworkId, title: order.artworkTitle })}
            target="_blank"
            rel="noreferrer"
          >
            {order.artworkTitle ? `${order.artworkTitle} · #${order.artworkId}` : order.artworkId}
          </a>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <FulfillmentBadge value={order.fulfillmentStatus} />
            <FulfillmentControl order={order} onChanged={refresh} />
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-blue-700 underline">
          <a href={`https://dashboard.stripe.com/search?query=${encodeURIComponent(order.paymentIntentId || order.stripeSessionId)}`} target="_blank" rel="noreferrer">
            voir
          </a>
        </td>
        <td className="px-4 py-3">
          <button onClick={onToggle} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50">
            {expanded ? "Masquer" : "Détails"}
          </button>
        </td>
        <td className="px-4 py-3">
          <button onClick={openWorkflow} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50">
            Suivi
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={14} className="px-6 py-4 text-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="font-medium text-slate-900">Acheteur</h3>
                <div className="text-slate-600">Nom : {order.buyerName || "-"}</div>
                <div className="text-slate-600">Email : {order.buyerEmail || "-"}</div>
                <div className="text-slate-600">Téléphone : {order.buyerPhone || "-"}</div>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Expédition</h3>
                <AddressView value={order.shippingAddress} redacted={sensitiveMode !== "full" && !!order.shippingAddressPresent} />
                {order.fulfillmentStatus === "shipped" && order.fulfilledAt && (
                  <div className="mt-2 text-xs text-slate-500">Expédié le {new Date(order.fulfilledAt).toLocaleDateString()}</div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Facturation</h3>
                <AddressView value={order.billingAddress} redacted={sensitiveMode !== "full" && !!order.billingAddressPresent} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function OrderWorkflowDrawer({
  open,
  data,
  loading,
  busy,
  error,
  onClose,
  onRefresh,
  onStatusChange,
  onAddNote,
  onScheduleFollowUp,
  onCompleteFollowUp,
}: {
  open: boolean;
  data: OrderDetailPayload | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onStatusChange: (status: OrderOpsStatus) => void;
  onAddNote: (content: string) => Promise<boolean | void> | void;
  onScheduleFollowUp: (summary: string, dueAtISO: string) => Promise<boolean | void> | void;
  onCompleteFollowUp: (activityId: string) => Promise<boolean | void> | void;
}) {
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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Commande</p>
            <h2 className="text-xl font-semibold text-slate-900">{data?.order.id ?? "—"}</h2>
            <p className="text-xs text-slate-500">{data ? formatAmount(data.order.amount, data.order.currency) : ""}</p>
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statut interne</p>
                    <p className="text-xs text-slate-500">Paiement {getLabel(data.order.status)} · Fulfillment {getLabel(data.order.fulfillmentStatus)}</p>
                  </div>
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={data.order.opsStatus}
                    disabled={busy}
                    onChange={(event) => onStatusChange(event.target.value as OrderOpsStatus)}
                  >
                    {ORDER_OPS_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Prochaine action: {data.order.nextActionAt ? formatDate(data.order.nextActionAt) : "non planifiée"}
                  {data.order.nextActionNote && <p className="text-xs text-slate-500">{data.order.nextActionNote}</p>}
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Planifier une action</p>
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
                  placeholder="Ex: Relancer transporteur, confirmer étiquette"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={busy}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (!followUpDate || !followUpSummary.trim()) {
                        addToast("Renseignez la date et un résumé avant de planifier une action.", "error");
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Note interne</p>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Précisez les échanges avec l’artiste, le client ou le logisticien."
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
                  <p className="text-xs text-slate-500">Actions internes et relances.</p>
                </div>
                <div className="space-y-3">
                  {data.timeline.map((entry) => (
                    <OrderTimelineEntry
                      key={entry.id}
                      entry={entry}
                      busy={busy}
                      onComplete={() => onCompleteFollowUp(entry.id)}
                    />
                  ))}
                  {data.timeline.length === 0 && <p className="text-sm text-slate-500">Aucun historique pour l’instant.</p>}
                </div>
              </section>

              <section className="space-y-2 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Synthèse achat</p>
                <p>Client : {data.order.buyerName || data.order.buyerEmail || "—"}</p>
                <p>Téléphone : {data.order.buyerPhone || "—"}</p>
                <p>Stripe : {data.order.paymentIntentId || data.order.stripeSessionId}</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderTimelineEntry({ entry, busy, onComplete }: { entry: WorkflowActivityDTO; busy: boolean; onComplete: () => void }) {
  const isFollowUp = entry.activityType === "follow_up";
  const done = Boolean(entry.completedAt);
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formatDate(entry.createdAt)}</span>
        <span className="font-semibold uppercase tracking-wide">{entry.activityType}</span>
      </div>
      <div className="mt-1 text-slate-900">{describeOrderActivity(entry)}</div>
      {isFollowUp && (
        <div className="mt-2 text-xs text-slate-500">
          Prévu le {entry.dueAt ? formatDate(entry.dueAt) : "—"}
        </div>
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

function describeOrderActivity(entry: WorkflowActivityDTO) {
  if (entry.activityType === "status") {
    const status = typeof entry.payload?.status === "string" ? (entry.payload.status as string) : "";
    return `Statut workflow → ${status ? getOrderOpsStatusLabel(status as OrderOpsStatus) : "—"}`;
  }
  if (entry.activityType === "note") {
    return (entry.payload?.content as string) || "Note interne";
  }
  if (entry.activityType === "follow_up") {
    return entry.payload?.summary ? String(entry.payload.summary) : "Action planifiée";
  }
  return "Action";
}

function formatAmount(value: number, currency: string) {
  return `${(value / 100).toFixed(2)} ${currency?.toUpperCase()}`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function exportStatusClass(status: string) {
  if (status === "ready") return "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800";
  if (status === "error") return "rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800";
  return "rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700";
}

function getLabel(value: string) {
  return value || "—";
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[value] || "bg-slate-200 text-slate-700"}`}>{value}</span>;
}

function FulfillmentBadge({ value }: { value: string }) {
  const classes: Record<string, string> = {
    pending_shipment: "bg-indigo-100 text-indigo-800",
    shipped: "bg-blue-100 text-blue-800",
  };
  const labels: Record<string, string> = {
    pending_shipment: "à expédier",
    shipped: "expédié",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes[value] || "bg-slate-200 text-slate-700"}`}>
      {labels[value] || value}
    </span>
  );
}

function FulfillmentControl({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [val, setVal] = useState(order.fulfillmentStatus || "pending_shipment");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, fulfillmentStatus: val }),
      });
      if (response.ok) {
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <select className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs" value={val} onChange={(event) => setVal(event.target.value)}>
        <option value="pending_shipment">à expédier</option>
        <option value="shipped">expédié</option>
      </select>
      <button onClick={save} disabled={saving} className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50">
        {saving ? "..." : "OK"}
      </button>
    </div>
  );
}

function AddressView({ value, redacted }: { value: any; redacted?: boolean }) {
  if (redacted) {
    return <div className="text-slate-500">Données masquées</div>;
  }
  if (!value) {
    return <div className="text-slate-500">-</div>;
  }
  return (
    <div className="text-slate-700">
      <div>{value.name || ""}</div>
      <div>{[value.line1, value.line2].filter(Boolean).join(", ")}</div>
      <div>{[value.postal_code, value.city || value.town, value.state].filter(Boolean).join(" ")}</div>
      <div>{value.country || ""}</div>
    </div>
  );
}

function RefundDialog({ order, onClose, onSuccess }: { order: Order; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const mfa = useMfaChallenge("orders.refund");
  const [otpCode, setOtpCode] = useState("");

  const handleDialogClose = () => {
    mfa.reset();
    setOtpCode("");
    onClose();
  };

  const handleVerifyCode = async () => {
    const ok = await mfa.verifyCode(otpCode);
    if (ok) {
      setOtpCode("");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("Décrivez brièvement le motif (10 caractères minimum).");
      return;
    }
    if (!mfa.token) {
      setError("Validez le code MFA avant de confirmer l’opération.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-mfa-token": mfa.token,
        },
        body: JSON.stringify({ reason: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Impossible de déclencher le remboursement.");
        mfa.reset();
        return;
      }
      setSuccess(true);
      setReason("");
      mfa.reset();
      onSuccess();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setOtpCode("");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Rembourser la commande</h2>
            <p className="text-sm text-slate-500">
              #{order.id} — {formatAmount(order.amount, order.currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDialogClose}
            className="text-slate-400 transition hover:text-slate-600"
            disabled={submitting}
            aria-label="Fermer"
          >
            &#215;
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          L’opération est totale et immédiate. Ajoutez un motif détaillant la demande client ou la raison métier pour les
          traces d’audit.
        </p>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Remboursement déclenché. Les informations se mettront à jour dans la liste dans un instant.
          </div>
        )}
        {!success && (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="refund-reason">
                Motif
              </label>
              <textarea
                id="refund-reason"
                required
                minLength={10}
                maxLength={500}
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ex : Le client s’est rétracté avant expédition."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation MFA ponctuelle</p>
                  <p className="text-xs text-slate-500">Un code unique est requis pour valider un remboursement.</p>
                </div>
                {mfa.hasToken && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Code validé
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <button
                  type="button"
                  onClick={mfa.requestChallenge}
                  disabled={mfa.requesting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {mfa.requesting ? "Envoi du code…" : mfa.challenge ? "Renvoyer un code MFA" : "Envoyer un code MFA"}
                </button>
                {mfa.challenge && (
                  <>
                    <p className="text-xs text-slate-500">
                      Code envoyé à {mfa.challenge.delivery?.maskedDestination || "votre adresse administrateur"}.
                    </p>
                    {mfa.challenge.debugCode && (
                      <p className="text-xs font-mono text-amber-600">
                        Mode dev : code {mfa.challenge.debugCode}
                      </p>
                    )}
                    {!mfa.hasToken && (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(event) => setOtpCode(event.target.value)}
                          placeholder="Code MFA"
                          className="flex-1 min-w-[140px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCode}
                          disabled={mfa.verifying || !otpCode.trim()}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          {mfa.verifying ? "Validation…" : "Valider"}
                        </button>
                      </div>
                    )}
                  </>
                )}
                {mfa.challengeError && <p className="text-xs text-rose-600">{mfa.challengeError}</p>}
                {mfa.verifyError && <p className="text-xs text-rose-600">{mfa.verifyError}</p>}
                {mfa.hasToken && mfa.tokenExpiresAt && (
                  <p className="text-xs text-emerald-700">
                    Code confirmé jusqu’à {new Date(mfa.tokenExpiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDialogClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !mfa.hasToken}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Confirmer le remboursement"}
              </button>
            </div>
          </form>
        )}
        {success && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleDialogClose}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
