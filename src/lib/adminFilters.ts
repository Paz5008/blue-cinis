import {
  Prisma,
  LeadStatus,
  OrderStatus,
  OrderOpsStatus,
  FulfillmentStatus,
} from '@prisma/client'
import { maskEmail, maskName, maskPhone, redactLongText } from './redact'

export type RawSearchParams = Record<string, string | string[] | undefined>

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const SENSITIVE_PARAM_VALUE = 'full'
export const ADMIN_EXPORT_LIMIT = 5000

type FilterPresetField<T> = {
  key: keyof T
  param?: string
  serialize?: (value: any) => string | undefined
  allowEmpty?: boolean
}

type BuildSearchParamsOptions = {
  page?: number
  pageSize?: number
  includePagination?: boolean
}

export type AdminFilterPreset<T> = {
  name: string
  defaultSort?: string
  fields: FilterPresetField<T>[]
  buildSearchParams(filters: Partial<T>, options?: BuildSearchParamsOptions): URLSearchParams
}

function createFilterPreset<T>(config: {
  name: string
  defaultSort?: string
  fields: FilterPresetField<T>[]
  pageParam?: string
  pageSizeParam?: string
}): AdminFilterPreset<T> {
  return {
    ...config,
    buildSearchParams(filters: Partial<T>, options: BuildSearchParamsOptions = {}) {
      const params = new URLSearchParams()
      const shouldIncludePagination = options.includePagination !== false
      if (shouldIncludePagination) {
        const page = Math.max(1, options.page ?? 1)
        const pageSize = clamp(options.pageSize ?? DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)
        params.set(config.pageParam ?? 'page', String(page))
        params.set(config.pageSizeParam ?? 'pageSize', String(pageSize))
      }

      for (const field of config.fields) {
        const paramName = field.param ?? String(field.key)
      const raw = filters[field.key]
        if (raw === undefined || raw === null) continue
        if (typeof raw === 'string' && !field.allowEmpty && !raw.trim()) continue
        const serialized = field.serialize ? field.serialize(raw as any) : String(raw)
        if (!serialized) continue
        params.set(paramName, serialized)
      }
      return params
    },
  }
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function toInt(value: string | string[] | undefined, fallback: number) {
  const parsed = parseInt(firstValue(value) || '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toStringValue(value: string | string[] | undefined, fallback = '') {
  const resolved = firstValue(value)
  return typeof resolved === 'string' ? resolved : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toBooleanFromSensitive(value: string | string[] | undefined) {
  return toStringValue(value) === SENSITIVE_PARAM_VALUE
}

const LEAD_STATUS_VALUES = new Set(Object.values(LeadStatus))
const ORDER_STATUS_VALUES = new Set(Object.values(OrderStatus))
const ORDER_OPS_STATUS_VALUES = new Set(Object.values(OrderOpsStatus))
const FULFILLMENT_STATUS_VALUES = new Set(Object.values(FulfillmentStatus))

function toEnumValue<T extends string>(value: string | undefined, dataset: Set<T>) {
  if (!value) return undefined
  const cast = value as T
  return dataset.has(cast) ? cast : undefined
}

const LEAD_SORT_VALUES = new Set(['createdAt_desc', 'createdAt_asc'] as const)
export type LeadSort = 'createdAt_desc' | 'createdAt_asc'

export type LeadFilters = {
  page: number
  pageSize: number
  q: string
  from: string
  to: string
  sort: LeadSort
  status: string
  includeSensitive: boolean
}

export function resolveLeadFilters(params: RawSearchParams): LeadFilters {
  const rawSort = toStringValue(params.sort, 'createdAt_desc')
  const sort = LEAD_SORT_VALUES.has(rawSort as LeadSort) ? (rawSort as LeadSort) : 'createdAt_desc'
  return {
    page: Math.max(1, toInt(params.page, 1)),
    pageSize: clamp(toInt(params.pageSize, DEFAULT_PAGE_SIZE), 1, MAX_PAGE_SIZE),
    q: toStringValue(params.q, '').trim(),
    from: toStringValue(params.from, ''),
    to: toStringValue(params.to, ''),
    sort,
    status: toStringValue(params.status, ''),
    includeSensitive: toBooleanFromSensitive(params.sensitive),
  }
}

export function buildLeadQuery(filters: LeadFilters) {
  const where: Prisma.LeadWhereInput = {}
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { email: { contains: filters.q, mode: 'insensitive' } },
      { message: { contains: filters.q, mode: 'insensitive' } },
    ]
  }
  if (filters.from || filters.to) {
    const createdAt: Prisma.DateTimeFilter = {}
    if (filters.from) createdAt.gte = new Date(filters.from)
    if (filters.to) createdAt.lte = new Date(filters.to)
    where.createdAt = createdAt
  }
  if (filters.status) {
    const status = toEnumValue(filters.status, LEAD_STATUS_VALUES)
    if (status) {
      where.status = status
    }
  }
  const orderBy: Prisma.LeadOrderByWithRelationInput =
    filters.sort === 'createdAt_asc' ? { createdAt: 'asc' } : { createdAt: 'desc' }
  return { where, orderBy }
}

const ORDER_SORT_VALUES = new Set([
  'createdAt_desc',
  'createdAt_asc',
  'amount_desc',
  'amount_asc',
  'net_desc',
  'net_asc',
] as const)
export type OrderSort =
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'net_desc'
  | 'net_asc'

export type OrderFilters = {
  page: number
  pageSize: number
  q: string
  status: string
  opsStatus: string
  fulfillment: string
  from: string
  to: string
  sort: OrderSort
  includeSensitive: boolean
}

export function resolveOrderFilters(params: RawSearchParams): OrderFilters {
  const rawSort = toStringValue(params.sort, 'createdAt_desc')
  const sort = ORDER_SORT_VALUES.has(rawSort as OrderSort) ? (rawSort as OrderSort) : 'createdAt_desc'
  return {
    page: Math.max(1, toInt(params.page, 1)),
    pageSize: clamp(toInt(params.pageSize, DEFAULT_PAGE_SIZE), 1, MAX_PAGE_SIZE),
    q: toStringValue(params.q, '').trim(),
    status: toStringValue(params.status, ''),
    opsStatus: toStringValue(params.opsStatus, ''),
    fulfillment: toStringValue(params.fulfillment, ''),
    from: toStringValue(params.from, ''),
    to: toStringValue(params.to, ''),
    sort,
    includeSensitive: toBooleanFromSensitive(params.sensitive),
  }
}

export function buildOrderQuery(filters: OrderFilters) {
  const where: Prisma.OrderWhereInput = {}
  if (filters.q) {
    const q = filters.q
    where.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { buyerEmail: { contains: q, mode: 'insensitive' } },
      { buyerName: { contains: q, mode: 'insensitive' } },
      { artworkId: { contains: q, mode: 'insensitive' } },
    ]
  }
  const orderStatus = toEnumValue(filters.status, ORDER_STATUS_VALUES)
  if (orderStatus) where.status = orderStatus
  const opsStatus = toEnumValue(filters.opsStatus, ORDER_OPS_STATUS_VALUES)
  if (opsStatus) where.opsStatus = opsStatus
  const fulfillmentStatus = toEnumValue(filters.fulfillment, FULFILLMENT_STATUS_VALUES)
  if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus
  if (filters.from || filters.to) {
    const createdAt: Prisma.DateTimeFilter = {}
    if (filters.from) createdAt.gte = new Date(filters.from)
    if (filters.to) createdAt.lte = new Date(filters.to)
    where.createdAt = createdAt
  }
  let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: 'desc' }
  if (filters.sort === 'createdAt_asc') orderBy = { createdAt: 'asc' }
  if (filters.sort === 'amount_desc') orderBy = { amount: 'desc' }
  if (filters.sort === 'amount_asc') orderBy = { amount: 'asc' }
  if (filters.sort === 'net_desc') orderBy = { net: 'desc' }
  if (filters.sort === 'net_asc') orderBy = { net: 'asc' }
  return { where, orderBy }
}

export type WebhookFilters = {
  page: number
  pageSize: number
  provider: string
  type: string
  eventId: string
  from: string
  to: string
}

export function resolveWebhookFilters(params: RawSearchParams): WebhookFilters {
  return {
    page: Math.max(1, toInt(params.page, 1)),
    pageSize: clamp(toInt(params.pageSize, DEFAULT_PAGE_SIZE), 1, MAX_PAGE_SIZE),
    provider: toStringValue(params.provider, '').trim(),
    type: toStringValue(params.type, '').trim(),
    eventId: toStringValue(params.eventId, '').trim(),
    from: toStringValue(params.from, '').trim(),
    to: toStringValue(params.to, '').trim(),
  }
}

export function buildWebhookQuery(filters: WebhookFilters) {
  const where: Prisma.WebhookEventWhereInput = {}
  if (filters.provider) {
    where.provider = { equals: filters.provider }
  }
  if (filters.type) {
    where.type = { contains: filters.type, mode: 'insensitive' }
  }
  if (filters.eventId) {
    where.eventId = { contains: filters.eventId, mode: 'insensitive' }
  }
  if (filters.from || filters.to) {
    const receivedAt: Prisma.DateTimeFilter = {}
    if (filters.from) receivedAt.gte = new Date(filters.from)
    if (filters.to) receivedAt.lte = new Date(filters.to)
    where.receivedAt = receivedAt
  }
  const orderBy: Prisma.WebhookEventOrderByWithRelationInput = { receivedAt: 'desc' }
  return { where, orderBy }
}

export type AuditFilters = {
  page: number
  pageSize: number
  action: string
  actor: string
  resource: string
  status: string
  from: string
  to: string
}

export function resolveAuditFilters(params: RawSearchParams): AuditFilters {
  return {
    page: Math.max(1, toInt(params.page, 1)),
    pageSize: clamp(toInt(params.pageSize, DEFAULT_PAGE_SIZE), 1, MAX_PAGE_SIZE),
    action: toStringValue(params.action, '').trim(),
    actor: toStringValue(params.actor, '').trim(),
    resource: toStringValue(params.resource, '').trim(),
    status: toStringValue(params.status, '').trim(),
    from: toStringValue(params.from, '').trim(),
    to: toStringValue(params.to, '').trim(),
  }
}

export function buildAuditQuery(filters: AuditFilters) {
  const where: Prisma.AdminAuditLogWhereInput = {}
  if (filters.action) {
    where.action = { contains: filters.action, mode: 'insensitive' }
  }
  if (filters.actor) {
    where.OR = [
      { actorEmail: { contains: filters.actor, mode: 'insensitive' } },
      { actorId: { contains: filters.actor, mode: 'insensitive' } },
    ]
  }
  if (filters.resource) {
    where.resource = { contains: filters.resource, mode: 'insensitive' }
  }
  if (filters.status) {
    where.metadata = { path: ['status'], equals: filters.status }
  }
  if (filters.from || filters.to) {
    const createdAt: Prisma.DateTimeFilter = {}
    if (filters.from) createdAt.gte = new Date(filters.from)
    if (filters.to) createdAt.lte = new Date(filters.to)
    where.createdAt = createdAt
  }
  const orderBy: Prisma.AdminAuditLogOrderByWithRelationInput = { createdAt: 'desc' }
  return { where, orderBy }
}

const ARTWORK_SORT_VALUES = new Set(['createdAt_desc', 'createdAt_asc', 'price_desc', 'price_asc'] as const)
export type ArtworkSort = 'createdAt_desc' | 'createdAt_asc' | 'price_desc' | 'price_asc'

export type ArtworkFilters = {
  page: number
  pageSize: number
  q: string
  sort: ArtworkSort
}

export function resolveArtworkFilters(params: RawSearchParams): ArtworkFilters {
  const rawSort = toStringValue(params.sort, 'createdAt_desc')
  const sort = ARTWORK_SORT_VALUES.has(rawSort as ArtworkSort) ? (rawSort as ArtworkSort) : 'createdAt_desc'
  return {
    page: Math.max(1, toInt(params.page, 1)),
    pageSize: clamp(toInt(params.pageSize, DEFAULT_PAGE_SIZE), 1, MAX_PAGE_SIZE),
    q: toStringValue(params.q, '').trim(),
    sort,
  }
}

export function buildArtworkQuery(filters: ArtworkFilters) {
  const where: Prisma.ArtworkWhereInput = {}
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { id: { equals: filters.q } },
      { artistName: { contains: filters.q, mode: 'insensitive' } },
    ]
  }
  let orderBy: Prisma.ArtworkOrderByWithRelationInput = { createdAt: 'desc' }
  if (filters.sort === 'createdAt_asc') orderBy = { createdAt: 'asc' }
  if (filters.sort === 'price_desc') orderBy = { price: 'desc' }
  if (filters.sort === 'price_asc') orderBy = { price: 'asc' }
  return { where, orderBy }
}

type CsvRow = Record<string, unknown>

function csvEscape(value: unknown) {
  if (value == null) return ''
  const str = String(value).replace(/"/g, '""')
  return /[",\n]/.test(str) ? `"${str}"` : str
}

function buildCsv(columns: string[], rows: CsvRow[]) {
  const lines = [columns.join(',')]
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(','))
  }
  return `${lines.join('\n')}\n`
}

type LeadCsvSource = {
  id: string
  name: string
  email: string | null
  phone?: string | null
  message?: string | null
  artworkId?: string | null
  artistId?: string | null
  createdAt: Date | string
}

export function buildLeadsCsv(rows: LeadCsvSource[], options: { includeSensitive: boolean }) {
  const columns = ['id', 'name', 'email', 'phone', 'message', 'artworkId', 'artistId', 'createdAt']
  const sanitized = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: options.includeSensitive ? row.email : maskEmail(row.email) ?? '',
    phone: options.includeSensitive ? row.phone : maskPhone(row.phone) ?? '',
    message: options.includeSensitive ? row.message ?? '' : redactLongText(row.message, 400) ?? '',
    artworkId: row.artworkId ?? '',
    artistId: row.artistId ?? '',
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : row.createdAt.toISOString(),
  }))
  return buildCsv(columns, sanitized)
}

type OrderCsvSource = {
  id: string
  artworkId: string
  artistId: string
  buyerEmail?: string | null
  buyerName?: string | null
  buyerPhone?: string | null
  amount: number
  currency: string
  fee: number
  tax: number
  shipping: number
  net: number
  stripeSessionId: string
  paymentIntentId?: string | null
  status: string
  opsStatus?: string | null
  fulfillmentStatus: string
  fulfilledAt?: Date | string | null
  createdAt: Date | string
  nextActionAt?: Date | string | null
}

export function buildOrdersCsv(rows: OrderCsvSource[], options: { includeSensitive: boolean }) {
  const columns = [
    'id',
    'artworkId',
    'artistId',
    'buyerEmail',
    'buyerName',
    'buyerPhone',
    'amount',
    'currency',
    'fee',
    'tax',
    'shipping',
    'net',
    'stripeSessionId',
    'paymentIntentId',
    'status',
    'opsStatus',
    'fulfillmentStatus',
    'fulfilledAt',
    'nextActionAt',
    'createdAt',
  ]
  const sanitized = rows.map((row) => ({
    id: row.id,
    artworkId: row.artworkId,
    artistId: row.artistId,
    buyerEmail: options.includeSensitive ? row.buyerEmail ?? '' : maskEmail(row.buyerEmail) ?? '',
    buyerName: options.includeSensitive ? row.buyerName ?? '' : maskName(row.buyerName) ?? '',
    buyerPhone: options.includeSensitive ? row.buyerPhone ?? '' : maskPhone(row.buyerPhone) ?? '',
    amount: row.amount,
    currency: row.currency,
    fee: row.fee,
    tax: row.tax,
    shipping: row.shipping,
    net: row.net,
    stripeSessionId: row.stripeSessionId,
    paymentIntentId: row.paymentIntentId ?? '',
    status: row.status,
    opsStatus: row.opsStatus ?? '',
    fulfillmentStatus: row.fulfillmentStatus,
    fulfilledAt:
      row.fulfilledAt == null ? '' : typeof row.fulfilledAt === 'string' ? row.fulfilledAt : row.fulfilledAt.toISOString(),
    nextActionAt:
      row.nextActionAt == null ? '' : typeof row.nextActionAt === 'string' ? row.nextActionAt : row.nextActionAt.toISOString(),
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : row.createdAt.toISOString(),
  }))
  return buildCsv(columns, sanitized)
}

export type LeadClientFiltersPreset = {
  q?: string
  from?: string
  to?: string
  status?: string
  sort?: LeadSort
  showSensitive?: boolean
}

const DEFAULT_LEAD_SORT: LeadSort = 'createdAt_desc'

export const LeadFilterPreset = createFilterPreset<LeadClientFiltersPreset>({
  name: 'leads',
  defaultSort: DEFAULT_LEAD_SORT,
  fields: [
    {
      key: 'q',
      serialize: (value) => {
        const trimmed = (value as string).trim()
        return trimmed || undefined
      },
    },
    { key: 'from' },
    { key: 'to' },
    { key: 'status' },
    {
      key: 'sort',
      serialize: (value) => (value && value !== DEFAULT_LEAD_SORT ? value : undefined),
    },
    {
      key: 'showSensitive',
      param: 'sensitive',
      serialize: (value) =>
        ((value as boolean) ? SENSITIVE_PARAM_VALUE : undefined) as string | undefined,
    },
  ],
})

export type OrderClientFiltersPreset = {
  q?: string
  status?: string
  opsStatus?: string
  fulfillment?: string
  from?: string
  to?: string
  sort?: OrderSort
  showSensitive?: boolean
}

const DEFAULT_ORDER_SORT: OrderSort = 'createdAt_desc'

export const OrderFilterPreset = createFilterPreset<OrderClientFiltersPreset>({
  name: 'orders',
  defaultSort: DEFAULT_ORDER_SORT,
  fields: [
    {
      key: 'q',
      serialize: (value) => {
        const trimmed = (value as string).trim()
        return trimmed || undefined
      },
    },
    { key: 'status' },
    { key: 'opsStatus', param: 'opsStatus' },
    { key: 'fulfillment' },
    { key: 'from' },
    { key: 'to' },
    {
      key: 'sort',
      serialize: (value) => (value && value !== DEFAULT_ORDER_SORT ? value : undefined),
    },
    {
      key: 'showSensitive',
      param: 'sensitive',
      serialize: (value) =>
        ((value as boolean) ? SENSITIVE_PARAM_VALUE : undefined) as string | undefined,
    },
  ],
})

export type ArtworkClientFiltersPreset = {
  q?: string
  sort?: ArtworkSort
}

const DEFAULT_ARTWORK_SORT: ArtworkSort = 'createdAt_desc'

export const ArtworkFilterPreset = createFilterPreset<ArtworkClientFiltersPreset>({
  name: 'artworks',
  defaultSort: DEFAULT_ARTWORK_SORT,
  fields: [
    {
      key: 'q',
      serialize: (value) => {
        const trimmed = (value as string).trim()
        return trimmed || undefined
      },
    },
    {
      key: 'sort',
      serialize: (value) => (value && value !== DEFAULT_ARTWORK_SORT ? value : undefined),
    },
  ],
})
