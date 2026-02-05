"use client";

import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

export type AuditEntry = {
  id: string;
  action: string;
  createdAt: string;
  actorEmail?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: "success" | "error" | "denied";
};

type AuditTimelineProps = {
  title?: string;
  description?: ReactNode;
  entries: AuditEntry[];
  emptyLabel?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
};

const STATUS_STYLES: Record<NonNullable<AuditEntry["status"]>, string> = {
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  error: "bg-rose-100 text-rose-800 border-rose-200",
  denied: "bg-amber-100 text-amber-800 border-amber-200",
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function extractStatus(entry: AuditEntry): NonNullable<AuditEntry["status"]> {
  if (entry.status) return entry.status;
  const metaStatus = entry.metadata && typeof entry.metadata.status === "string" ? entry.metadata.status : null;
  if (metaStatus === "error" || metaStatus === "denied") {
    return metaStatus;
  }
  return "success";
}

function formatMetadata(metadata: AuditEntry["metadata"]) {
  if (!metadata) return "—";
  const clone: Record<string, unknown> = { ...metadata };
  delete clone.status;
  const entries = Object.entries(clone);
  if (!entries.length) return "—";
  return entries
    .map(([key, value]) => {
      if (value == null) return `${key}: —`;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return `${key}: ${value}`;
      }
      try {
        const serialized = JSON.stringify(value);
        return `${key}: ${serialized}`;
      } catch {
        return `${key}: [objet]`;
      }
    })
    .slice(0, 3)
    .join(" · ");
}

export default function AuditTimeline({ title, description, entries, emptyLabel, refreshing, onRefresh }: AuditTimelineProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title ?? "Historique"}</p>
          {description && <div className="text-xs text-slate-500">{description}</div>}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {entries.map((entry) => {
          const status = extractStatus(entry);
          return (
            <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{formatDate(entry.createdAt)}</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
                  {status === "success" ? "OK" : status === "denied" ? "refusé" : "erreur"}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{entry.action}</div>
              <div className="text-xs text-slate-500">{entry.actorEmail || "Système"}</div>
              <div className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600">{formatMetadata(entry.metadata)}</div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            {emptyLabel || "Aucune activité récente."}
          </div>
        )}
      </div>
    </div>
  );
}
