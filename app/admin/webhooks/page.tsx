import { prisma } from '@/lib/prisma'
import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { maskEmail, maskName, maskPhone } from '@/lib/redact'
import { resolveWebhookFilters, buildWebhookQuery, type WebhookFilters } from '@/lib/adminFilters'
import { WebhookReplayButton } from './_components/WebhookReplayButton'

type SearchParams = Record<string, string | string[] | undefined>

const SENSITIVE_KEY_MATCHERS = [
  /email/i,
  /phone/i,
  /name/i,
  /address/i,
  /customer/i,
  /session/i,
  /token/i,
  /signature/i,
]

function scrubPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => scrubPayload(entry))
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (shouldMaskKey(key)) {
        result[key] = maskSensitiveValue(entry)
      } else {
        result[key] = scrubPayload(entry)
      }
    }
    return result
  }
  return value
}

function shouldMaskKey(key: string) {
  return SENSITIVE_KEY_MATCHERS.some((regex) => regex.test(key))
}

function maskSensitiveValue(value: unknown) {
  if (typeof value === 'string') {
    if (value.includes('@')) return maskEmail(value) ?? '***'
    if (/\d{5}/.test(value)) return maskPhone(value) ?? '***'
    if (value.split(' ').length <= 3) return maskName(value) ?? '***'
    return '***'
  }
  if (typeof value === 'number') return '***'
  if (Array.isArray(value)) return value.map(() => '***')
  if (value && typeof value === 'object') return '***'
  return value
}

function formatPayload(payload: unknown) {
  const sanitized = scrubPayload(payload)
  const json = JSON.stringify(sanitized, null, 2)
  const MAX_LENGTH = 4000
  return json.length > MAX_LENGTH ? `${json.slice(0, MAX_LENGTH)}\n…` : json
}

function buildBaseQuery(filters: WebhookFilters) {
  const params = new URLSearchParams()
  if (filters.provider) params.set('provider', filters.provider)
  if (filters.type) params.set('type', filters.type)
  if (filters.eventId) params.set('eventId', filters.eventId)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  params.set('pageSize', String(filters.pageSize))
  return params
}

function buildPageHref(base: URLSearchParams, page: number) {
  const params = new URLSearchParams(base.toString())
  params.set('page', String(page))
  return `?${params.toString()}`
}

export default async function WebhooksAdminPage({ searchParams }: { searchParams?: SearchParams }) {
  await requireAdminSessionOrRedirect('/admin/webhooks')
  const filters = resolveWebhookFilters(searchParams ?? {})
  const { where, orderBy } = buildWebhookQuery(filters)
  const [total, rows] = await Promise.all([
    prisma.webhookEvent.count({ where }),
    prisma.webhookEvent.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ])
  const events = rows.map((event) => ({
    id: event.id,
    provider: event.provider,
    type: event.type,
    eventId: event.eventId,
    receivedAt: event.receivedAt.toISOString(),
    payload: formatPayload(event.payload),
  }))
  const baseQuery = buildBaseQuery(filters)
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))

  return (
    <section className="space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Webhooks entrants</h1>
        <p className="text-sm text-slate-500">
          Vérifiez les notifications Stripe et services tiers. Les données sensibles sont masquées automatiquement.
        </p>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          Les emails, téléphones, adresses et identifiants sont obfusqués avant affichage pour éviter toute fuite.
        </div>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-3" method="get">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Provider</label>
          <input
            type="text"
            name="provider"
            defaultValue={filters.provider}
            placeholder="ex: stripe"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Type</label>
          <input
            type="text"
            name="type"
            defaultValue={filters.type}
            placeholder="checkout.session.completed"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Event ID</label>
          <input
            type="text"
            name="eventId"
            defaultValue={filters.eventId}
            placeholder="evt_..."
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
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
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} lignes
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-3 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Appliquer
          </button>
          <a
            href="/admin/webhooks"
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
            href={buildPageHref(baseQuery, Math.max(1, filters.page - 1))}
            className={`rounded-lg border px-3 py-1 shadow-sm transition ${
              filters.page <= 1 ? 'cursor-not-allowed border-slate-100 text-slate-400' : 'border-slate-200 hover:bg-slate-50'
            }`}
            aria-disabled={filters.page <= 1}
          >
            Précédent
          </a>
          <a
            href={buildPageHref(baseQuery, Math.min(totalPages, filters.page + 1))}
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

      <div className="space-y-4">
        {events.map((event) => (
          <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{event.provider}</p>
                <p className="text-lg font-semibold text-slate-900">{event.type}</p>
                {event.eventId && <p className="text-xs text-slate-500">#{event.eventId}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <div className="text-sm text-slate-500">{new Date(event.receivedAt).toLocaleString()}</div>
                <WebhookReplayButton
                  event={{
                    id: event.id,
                    provider: event.provider,
                    type: event.type,
                    eventId: event.eventId || undefined,
                  }}
                />
              </div>
            </div>
            <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-slate-900/95 p-4 text-xs leading-relaxed text-slate-100">
              {event.payload}
            </pre>
          </article>
        ))}
        {events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Aucun webhook reçu pour ces filtres.
          </div>
        )}
      </div>
    </section>
  )
}
