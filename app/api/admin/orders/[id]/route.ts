import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { maskEmail, maskName, maskPhone } from '@/lib/redact'
import { ORDER_OPS_STATUS_OPTIONS, type OrderOpsStatus, type WorkflowActivityDTO } from '@/lib/workflows'
import { logger } from '@/lib/logger'
import { describeMfaFailure, validateMfaToken } from '@/lib/mfa'

const ORDER_DETAIL_SELECT = {
  id: true,
  artworkId: true,
  artistId: true,
  buyerEmail: true,
  buyerName: true,
  buyerPhone: true,
  amount: true,
  currency: true,
  fee: true,
  tax: true,
  shipping: true,
  net: true,
  stripeSessionId: true,
  paymentIntentId: true,
  status: true,
  opsStatus: true,
  fulfillmentStatus: true,
  fulfilledAt: true,
  billingAddress: true,
  shippingAddress: true,
  createdAt: true,
  updatedAt: true,
  nextActionAt: true,
  nextActionNote: true,
} as const

const orderStatusValues = ORDER_OPS_STATUS_OPTIONS.map((option) => option.value)

const followUpSchema = z.object({
  summary: z.string().min(3).max(400),
  dueAt: z.string().datetime().transform((value) => new Date(value)),
})

const orderWorkflowActionSchema = z.discriminatedUnion('intent', [
  z.object({ intent: z.literal('ops_status'), status: z.enum(orderStatusValues as [OrderOpsStatus, ...OrderOpsStatus[]]) }),
  z.object({ intent: z.literal('note'), content: z.string().min(3).max(2000) }),
  z.object({ intent: z.literal('follow_up'), ...followUpSchema.shape }),
  z.object({ intent: z.literal('complete_follow_up'), activityId: z.string().min(1), outcome: z.string().max(500).optional() }),
])

type OrderDetailResponse = {
  order: ReturnType<typeof serializeOrder>
  timeline: WorkflowActivityDTO[]
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const includeSensitive = new URL(req.url).searchParams.get('sensitive') === 'full'
  if (includeSensitive) {
    const mfaResult = await validateMfaToken({
      token: req.headers.get('x-admin-mfa-token'),
      userId: session.user.id,
      scope: 'orders.detail',
      consume: false,
    })
    if (!mfaResult.ok) {
      return NextResponse.json({ error: describeMfaFailure(mfaResult.reason) }, { status: 403 })
    }
  }
  const payload = await fetchOrderDetail(params.id, { includeSensitive })
  if (!payload) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await recordAdminAuditLog({
    action: 'orders.detail.fetch',
    resource: params.id,
    session,
    request: req,
    metadata: { sensitiveMode: includeSensitive ? 'full' : 'masked' },
  })
  return NextResponse.json(payload)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const orderId = params.id
  const json = await req.json().catch(() => null)
  const parsed = orderWorkflowActionSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const action = parsed.data.intent
  try {
    await ensureOrderExists(orderId)
    if (action === 'ops_status') {
      await prisma.order.update({ where: { id: orderId }, data: buildOpsStatusUpdate(parsed.data.status) })
      await logOrderActivity(orderId, 'status', { scope: 'ops', status: parsed.data.status }, session)
    } else if (action === 'note') {
      const content = parsed.data.content.trim()
      await logOrderActivity(orderId, 'note', { content }, session)
    } else if (action === 'follow_up') {
      await logOrderActivity(orderId, 'follow_up', { summary: parsed.data.summary }, session, { dueAt: parsed.data.dueAt })
      await recomputeOrderNextAction(orderId)
    } else if (action === 'complete_follow_up') {
      const existing = await prisma.workflowActivity.findUnique({ where: { id: parsed.data.activityId } })
      if (!existing || existing.entityType !== 'order' || existing.entityId !== orderId || existing.activityType !== 'follow_up') {
        return NextResponse.json({ error: 'Action introuvable' }, { status: 404 })
      }
      const payload = mergePayload(existing.payload, parsed.data.outcome)
      await prisma.workflowActivity.update({ where: { id: existing.id }, data: { payload, completedAt: new Date() } })
      await recomputeOrderNextAction(orderId)
    }

    await recordAdminAuditLog({
      action: `orders.workflow.${action}`,
      resource: orderId,
      session,
      request: req,
      metadata: { intent: action },
    })
  } catch (error) {
    logger.error({ err: error, orderId, action }, '[orders] workflow action failed')
    await recordAdminAuditLog({
      action: `orders.workflow.${action}`,
      resource: orderId,
      session,
      request: req,
      status: 'error',
      metadata: { intent: action },
    })
    return NextResponse.json({ error: 'Action impossible' }, { status: 500 })
  }

  let includeSensitive = new URL(req.url).searchParams.get('sensitive') === 'full'
  if (includeSensitive) {
    const mfaResult = await validateMfaToken({
      token: req.headers.get('x-admin-mfa-token'),
      userId: session.user.id,
      scope: 'orders.detail',
      consume: false,
    })
    if (!mfaResult.ok) {
      includeSensitive = false
    }
  }
  const payload = await fetchOrderDetail(orderId, { includeSensitive })
  return NextResponse.json(payload)
}

async function ensureOrderExists(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!order) {
    throw new Error('Order not found')
  }
}

function buildOpsStatusUpdate(status: OrderOpsStatus): Prisma.OrderUpdateInput {
  const data: Prisma.OrderUpdateInput = { opsStatus: status }
  if (status === 'completed') {
    data.nextActionAt = null
    data.nextActionNote = null
  }
  return data
}

async function logOrderActivity(
  entityId: string,
  activityType: 'status' | 'note' | 'follow_up',
  payload: Record<string, unknown>,
  session: Session,
  options?: { dueAt?: Date },
) {
  const author = resolveAuthor(session)
  await prisma.workflowActivity.create({
    data: {
      entityType: 'order',
      entityId,
      activityType,
      payload: payload as Prisma.JsonObject,
      dueAt: options?.dueAt,
      authorId: author.authorId,
      authorEmail: author.authorEmail,
      authorName: author.authorName,
    },
  })
}

async function recomputeOrderNextAction(orderId: string) {
  const next = await prisma.workflowActivity.findFirst({
    where: {
      entityType: 'order',
      entityId: orderId,
      activityType: 'follow_up',
      completedAt: null,
    },
    orderBy: [{ dueAt: 'asc' }],
  })
  await prisma.order.update({
    where: { id: orderId },
    data: {
      nextActionAt: next?.dueAt ?? null,
      nextActionNote: extractSummary(next?.payload) ?? null,
    },
  })
}

function extractSummary(payload: Prisma.JsonValue | null | undefined) {
  if (!payload || typeof payload !== 'object') return null
  const summary = (payload as Record<string, unknown>).summary
  return typeof summary === 'string' ? summary : null
}

function mergePayload(payload: Prisma.JsonValue | null, outcome?: string) {
  const base: Record<string, unknown> = payload && typeof payload === 'object' ? { ...(payload as Record<string, unknown>) } : {}
  if (outcome?.trim()) {
    base.outcome = outcome.trim()
  }
  base.status = 'done'
  return base as Prisma.JsonObject
}

async function fetchOrderDetail(id: string, options: { includeSensitive: boolean }): Promise<OrderDetailResponse | null> {
  const order = await prisma.order.findUnique({ where: { id }, select: ORDER_DETAIL_SELECT })
  if (!order) return null
  const timeline = await prisma.workflowActivity.findMany({
    where: { entityType: 'order', entityId: id },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })
  return {
    order: serializeOrder(order, options.includeSensitive),
    timeline: timeline.map(serializeActivity),
  }
}

function serializeOrder(order: Prisma.OrderGetPayload<{ select: typeof ORDER_DETAIL_SELECT }>, includeSensitive: boolean) {
  const shippingAddressPresent = Boolean(order.shippingAddress)
  const billingAddressPresent = Boolean(order.billingAddress)
  return {
    ...order,
    buyerEmail: includeSensitive ? order.buyerEmail : maskEmail(order.buyerEmail),
    buyerPhone: includeSensitive ? order.buyerPhone : maskPhone(order.buyerPhone),
    buyerName: includeSensitive ? order.buyerName : maskName(order.buyerName),
    shippingAddress: includeSensitive ? order.shippingAddress : null,
    billingAddress: includeSensitive ? order.billingAddress : null,
    shippingAddressPresent,
    billingAddressPresent,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    fulfilledAt: order.fulfilledAt ? order.fulfilledAt.toISOString() : null,
    nextActionAt: order.nextActionAt ? order.nextActionAt.toISOString() : null,
  }
}

function serializeActivity(entry: Prisma.WorkflowActivityGetPayload<{
  select: {
    id: true
    activityType: true
    payload: true
    dueAt: true
    completedAt: true
    createdAt: true
    authorEmail: true
    authorName: true
  }
}>): WorkflowActivityDTO {
  return {
    id: entry.id,
    activityType: entry.activityType as WorkflowActivityDTO['activityType'],
    payload: (entry.payload as Record<string, unknown> | null) ?? null,
    createdAt: entry.createdAt.toISOString(),
    dueAt: entry.dueAt ? entry.dueAt.toISOString() : null,
    completedAt: entry.completedAt ? entry.completedAt.toISOString() : null,
    authorEmail: entry.authorEmail,
    authorName: entry.authorName,
  }
}

function resolveAuthor(session: Session) {
  const authorId = typeof session.user?.id === 'string' ? session.user.id : null
  return {
    authorId,
    authorEmail: session.user?.email ?? null,
    authorName: session.user?.name ?? null,
  }
}
