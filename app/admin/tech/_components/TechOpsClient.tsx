"use client";

import { useMemo, useState } from "react";
import type { AdminExportJobDTO } from "@/lib/adminExports";

type ScriptDefinition = {
  id: string;
  label: string;
  description: string;
  tags: string[];
  paths: string[];
};

type CacheGroupDefinition = {
  key: string;
  label: string;
  description: string;
  tags: readonly string[];
  paths: readonly string[];
};

type RuntimeAlertSummary = {
  key: string;
  reason: string;
  severity: 'warning' | 'critical';
  occurrences: number;
  lastTriggeredAt: string;
};

type TechOpsClientProps = {
  scripts: ScriptDefinition[];
  cacheGroups: CacheGroupDefinition[];
  jobs: {
    leads: AdminExportJobDTO[];
    orders: AdminExportJobDTO[];
  };
  docsPath: string;
  runtimeAlerts: RuntimeAlertSummary[];
};

type ScriptRun = {
  executedAt: string;
  tags: number;
  paths: number;
};

type ExportKind = "leads" | "orders";

const EXPORT_TYPES: Record<ExportKind, { label: string; apiType: string }> = {
  leads: { label: "Exports leads", apiType: "leads_csv" },
  orders: { label: "Exports commandes", apiType: "orders_csv" },
};

export default function TechOpsClient({ scripts, cacheGroups, jobs, docsPath, runtimeAlerts }: TechOpsClientProps) {
  const [scriptRuns, setScriptRuns] = useState<Record<string, ScriptRun>>({});
  const [scriptLoading, setScriptLoading] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [jobState, setJobState] = useState(jobs);
  const [jobLoading, setJobLoading] = useState<Record<ExportKind, boolean>>({
    leads: false,
    orders: false,
  });
  const [jobError, setJobError] = useState<string | null>(null);

  const hasScripts = scripts.length > 0;

  const sortedScripts = useMemo(() => scripts.slice().sort((a, b) => a.label.localeCompare(b.label)), [scripts]);
  const hasCriticalRuntimeAlerts = runtimeAlerts.some((alert) => alert.severity === 'critical');

  const executeScript = async (scriptId: string) => {
    if (scriptLoading) return;
    setScriptError(null);
    setScriptLoading(scriptId);
    try {
      const res = await fetch("/api/admin/maintenance/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId }),
      });
      if (!res.ok) {
        throw new Error("script_failed");
      }
      const payload = (await res.json()) as {
        executedAt?: string;
        tags?: string[];
        paths?: string[];
      };
      setScriptRuns((prev) => ({
        ...prev,
        [scriptId]: {
          executedAt: payload.executedAt ?? new Date().toISOString(),
          tags: payload.tags?.length ?? 0,
          paths: payload.paths?.length ?? 0,
        },
      }));
    } catch {
      setScriptError("Impossible d’exécuter ce script. Réessayez dans quelques secondes.");
    } finally {
      setScriptLoading(null);
    }
  };

  const refreshJobs = async (kind: ExportKind) => {
    setJobError(null);
    setJobLoading((prev) => ({ ...prev, [kind]: true }));
    try {
      const res = await fetch(`/api/admin/exports?type=${EXPORT_TYPES[kind].apiType}&limit=6`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("jobs_failed");
      }
      const payload = (await res.json()) as { jobs: AdminExportJobDTO[] };
      setJobState((prev) => ({
        ...prev,
        [kind]: payload.jobs ?? [],
      }));
    } catch {
      setJobError("Rafraîchissement impossible. Les données affichées datent du dernier chargement.");
    } finally {
      setJobLoading((prev) => ({ ...prev, [kind]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {runtimeAlerts.length > 0 && (
        <section
          className={`rounded-2xl border ${
            hasCriticalRuntimeAlerts ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'
          } p-6 shadow-sm`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode dégradé détecté</p>
              <h2 className="text-lg font-semibold text-slate-900">
                {hasCriticalRuntimeAlerts ? 'Incidents critiques' : 'Avertissements en production'}
              </h2>
              <p className="text-sm text-slate-600">
                Certains modules servent des données statiques. Vérifiez la base, les webhooks et les intégrations listés ci-dessous.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {runtimeAlerts.map((alert) => (
              <div key={alert.key} className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">{alert.key}</span>
                  <span
                    className={`text-xs font-semibold ${
                      alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  >
                    {alert.severity === 'critical' ? 'Critique' : 'Avertissement'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{alert.reason}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Dernier signal&nbsp;: {new Date(alert.lastTriggeredAt).toLocaleString()} —{' '}
                  {alert.occurrences} occurrence{alert.occurrences > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scripts de revalidation</p>
            <h2 className="text-lg font-semibold text-slate-900">Purge ciblée des caches</h2>
            <p className="text-sm text-slate-500">
              Chaque script invalide un ensemble de tags Next.js et relance les pages les plus critiques.
            </p>
          </div>
        </div>
        {scriptError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {scriptError}
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {hasScripts ? (
            sortedScripts.map((script) => {
              const lastRun = scriptRuns[script.id];
              return (
                <article key={script.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">{script.id}</p>
                        <h3 className="text-base font-semibold text-slate-900">{script.label}</h3>
                        <p className="text-sm text-slate-500">{script.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => executeScript(script.id)}
                        disabled={scriptLoading === script.id}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                      >
                        {scriptLoading === script.id ? "Exécution..." : "Lancer"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {script.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    {script.paths.length > 0 && (
                      <div className="text-xs text-slate-500">
                        {script.paths.map((path) => (
                          <span key={path} className="mr-2 inline-flex items-center">
                            <span className="mr-1 text-slate-400">↻</span>
                            {path}
                          </span>
                        ))}
                      </div>
                    )}
                    {lastRun && (
                      <p className="text-xs text-emerald-700">
                        Exécuté le {formatDateTime(lastRun.executedAt)} — {lastRun.tags} tags, {lastRun.paths} chemins.
                      </p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">Aucun script configuré.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tags de cache</p>
          <h2 className="text-lg font-semibold text-slate-900">Cartographie centralisée</h2>
          <p className="text-sm text-slate-500">Comprenez quelles surfaces sont invalidées avant de lancer un script.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {cacheGroups.map((group) => (
            <article key={group.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <h3 className="text-base font-semibold text-slate-900">{group.label}</h3>
              <p className="text-sm text-slate-500">{group.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {group.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-sm">
                    #{tag}
                  </span>
                ))}
              </div>
              {group.paths.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Pages :</span>{" "}
                  {group.paths.map((path) => (
                    <span key={path} className="mr-2 inline-flex items-center">
                      <span className="mr-1 text-slate-400">↻</span>
                      {path}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exports asynchrones</p>
          <h2 className="text-lg font-semibold text-slate-900">Suivi des jobs lourds</h2>
          <p className="text-sm text-slate-500">Tous les exports sont désormais traités en arrière-plan pour éviter de bloquer l’interface.</p>
        </div>
        {jobError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {jobError}
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(Object.keys(EXPORT_TYPES) as ExportKind[]).map((kind) => (
            <article key={kind} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{EXPORT_TYPES[kind].label}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{EXPORT_TYPES[kind].apiType}</p>
                </div>
                <button
                  type="button"
                  onClick={() => refreshJobs(kind)}
                  disabled={jobLoading[kind]}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {jobLoading[kind] ? "Rafraîchissement..." : "Rafraîchir"}
                </button>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {jobState[kind].length === 0 && <p className="text-slate-500">Aucun job récent.</p>}
                {jobState[kind].map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{job.fileName || job.type}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(job.createdAt)}</p>
                      </div>
                      <span className={statusClass(job.status)}>{job.status}</span>
                    </div>
                    {job.downloadUrl && (
                      <a
                        href={job.downloadUrl}
                        className="mt-2 inline-flex items-center rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Télécharger
                      </a>
                    )}
                    {job.errorMessage && (
                      <p className="mt-2 text-xs text-rose-600">{job.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Documentation d’exploitation</p>
        <h2 className="text-lg font-semibold text-blue-900">Guide opérateur</h2>
        <p className="text-sm text-blue-900/80">
          Le guide détaille les playbooks de purge cache, le pipeline d’export et les actions de reprise.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-blue-900/80">
          <li>Scripts disponibles et tags purgés.</li>
          <li>Cycle de vie des exports (pending → processing → ready).</li>
          <li>Procédure de rollback et points de contact.</li>
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-blue-900">
          <code className="rounded-lg bg-white px-3 py-1 font-mono text-xs text-blue-700 shadow-sm">{docsPath}</code>
          <span className="text-xs text-blue-800">
            Accessible dans le dépôt + partage Slack #ops. Utilisez <code>less {docsPath}</code> pour le consulter rapidement.
          </span>
        </div>
      </section>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "ready") return "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800";
  if (status === "error") return "rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800";
  if (status === "processing") return "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800";
  return "rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700";
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
