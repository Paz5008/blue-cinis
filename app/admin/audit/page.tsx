import { prisma } from '@/lib/prisma'
import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { resolveAuditFilters, buildAuditQuery } from '@/lib/adminFilters'

type SearchParams = Record<string, string | string[] | undefined>

function resolveStatus(metadata: any): string {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata) && 'status' in metadata) {
    return String(metadata.status) || 'success'
  }
  return 'success'
}

function stripStatus(metadata: any) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return metadata
  }
  const { status: _status, ...rest } = metadata as Record<string, unknown>
  return Object.keys(rest).length ? rest : null
}

function formatMetadata(metadata: any) {
  if (!metadata) return '—'
  try {
    const json = JSON.stringify(metadata, null, 2)
    const MAX = 600
    return json.length > MAX ? `${json.slice(0, MAX)}\n…` : json
  } catch {
    return String(metadata)
  }
}

function StatusBadge({ value }: { value: string }) {
  const base = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium '
  if (value === 'error') return <span className={`${base}bg-rose-100 text-rose-700`}>Erreur</span>
  if (value === 'denied') return <span className={`${base}bg-amber-100 text-amber-700`}>Refusé</span>
  return <span className={`${base}bg-emerald-100 text-emerald-700`}>OK</span>
}

function buildAuditBaseQuery(filters: ReturnType<typeof resolveAuditFilters>) {
  const params = new URLSearchParams()
  if (filters.action) params.set('action', filters.action)
  if (filters.actor) params.set('actor', filters.actor)
  if (filters.resource) params.set('resource', filters.resource)
  if (filters.status) params.set('status', filters.status)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  params.set('pageSize', String(filters.pageSize))
  return params
}

function buildHref(base: URLSearchParams, page: number) {
  const params = new URLSearchParams(base.toString())
  params.set('page', String(page))
  return `?${params.toString()}`
}

export default async function AdminAuditPage({ searchParams }: { searchParams?: SearchParams }) {
  await requireAdminSessionOrRedirect('/admin/audit')
  const filters = resolveAuditFilters(searchParams ?? {})
  const { where, orderBy } = buildAuditQuery(filters)
  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ])
  const baseQuery = buildAuditBaseQuery(filters)
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))

  return (
    <section className="space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Journal d’audit</h1>
        <p className="text-sm text-slate-500">
          Chaque action sensible est tracée pour assurer la conformité et faciliter les investigations de sécurité.
        </p>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4" method="get">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Action</label>
          <input
            name="action"
            defaultValue={filters.action}
            placeholder="orders.refund"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Acteur</label>
          <input
            name="actor"
            defaultValue={filters.actor}
            placeholder="email ou id"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Resource</label>
          <input
            name="resource"
            defaultValue={filters.resource}
            placeholder="orderId..."
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Statut</label>
          <select
            name="status"
            defaultValue={filters.status}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Tous</option>
            <option value="success">Succes</option>
            <option value="denied">Refuse</option>
            <option value="error">Erreur</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Début</label>
          <input
            type="date"
            name="from"
            defaultValue={filters.from}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Fin</label>
          <input
            type="date"
            name="to"
            defaultValue={filters.to}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Page size</label>
          <select
            name="pageSize"
            defaultValue={String(filters.pageSize)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {[20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} lignes
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-4 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Appliquer
          </button>
          <a
            href="/admin/audit"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Réinitialiser
          </a>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div>
          Page {filters.page} / {totalPages} — {total} événements
        </div>
        <div className="flex gap-2">
          <a
            href={buildHref(baseQuery, Math.max(1, filters.page - 1))}
            className={`rounded-lg border px-3 py-1 shadow-sm transition ${
              filters.page <= 1 ? 'cursor-not-allowed border-slate-100 text-slate-400' : 'border-slate-200 hover:bg-slate-50'
            }`}
            aria-disabled={filters.page <= 1}
          >
            Précédent
          </a>
          <a
            href={buildHref(baseQuery, Math.min(totalPages, filters.page + 1))}
            className={`rounded-lg border px-3 py-1 shadow-sm transition ${
              filters.page >= totalPages
                ? 'cursor-not-allowed border-slate-100 text-slate-400'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
            aria-disabled={filters.page >= totalPages}
          >
            Suivant
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Acteur</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const status = resolveStatus(log.metadata as any)
              const metadata = stripStatus(log.metadata as any)
              return (
                <tr key={log.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{log.action}</div>
                    <StatusBadge value={status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{log.resource || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900">{log.actorEmail || '—'}</div>
                    {log.actorId && <div className="text-xs text-slate-500">{log.actorId}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{log.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-600">
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap">{formatMetadata(metadata)}</pre>
                  </td>
                </tr>
              )
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  Aucun événement d’audit pour ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
