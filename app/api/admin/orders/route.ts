import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { maskEmail, maskName, maskPhone } from '@/lib/redact'
import { z } from 'zod'
import { buildOrderQuery, resolveOrderFilters } from '@/lib/adminFilters'
import { logger } from '@/lib/logger'
import { describeMfaFailure, validateMfaToken } from '@/lib/mfa'

const updateFulfillmentSchema = z.object({
  id: z.string().min(1),
  fulfillmentStatus: z.enum(['pending_shipment', 'shipped']),
})

const ORDER_LIST_FIELDS = {
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
  nextActionAt: true,
  nextActionNote: true,

}

export async function GET(req: NextRequest) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const rawParams: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    rawParams[key] = value
  })
  const filters = resolveOrderFilters(rawParams)
  const includeSensitive = filters.includeSensitive
  if (includeSensitive) {
    const mfaResult = await validateMfaToken({
      token: req.headers.get('x-admin-mfa-token'),
      userId: session.user.id,
      scope: 'orders.list',
      consume: false,
    })
    if (!mfaResult.ok) {
      return NextResponse.json({ error: describeMfaFailure(mfaResult.reason) }, { status: 403 })
    }
  }
  const effectiveFilters = { ...filters, includeSensitive }
  const { where, orderBy } = buildOrderQuery(effectiveFilters)

  const total = await prisma.order.count({ where })
  const rows = await prisma.order.findMany({
    where,
    orderBy,
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
    select: ORDER_LIST_FIELDS,
  })
  const artworkIds = Array.from(new Set(rows.map((r) => r.artworkId)))
  const artworks = await prisma.artwork.findMany({
    where: { id: { in: artworkIds } },
    select: { id: true, title: true },
  })
  const artworkMap = new Map(artworks.map((a) => [a.id, a]))

  const items = rows.map((order) => {
    const artwork = artworkMap.get(order.artworkId)
    const baseOrder = order
    const masked = includeSensitive
      ? baseOrder
      : {
        ...baseOrder,
        buyerEmail: maskEmail(baseOrder.buyerEmail),
        buyerPhone: maskPhone(baseOrder.buyerPhone),
        buyerName: maskName(baseOrder.buyerName),
        billingAddress: null,
        shippingAddress: null,
      }
    return {
      ...masked,
      shippingAddressPresent: Boolean(baseOrder.shippingAddress),
      billingAddressPresent: Boolean(baseOrder.billingAddress),
      artworkTitle: artwork?.title ?? null,
    }
  })

  await recordAdminAuditLog({
    action: 'orders.list',
    resource: `orders?page=${filters.page}`,
    session,
    request: req,
    metadata: {
      filters: {
        status: filters.status || null,
        opsStatus: filters.opsStatus || null,
        fulfillment: filters.fulfillment || null,
        from: Boolean(filters.from),
        to: Boolean(filters.to),
      },
      sensitiveMode: includeSensitive ? 'full' : 'masked',
      pageSize: filters.pageSize,
    },
  })

  return NextResponse.json({
    page: filters.page,
    pageSize: filters.pageSize,
    total,
    items,
    sensitiveMode: includeSensitive ? 'full' : 'masked',
  })
}

export async function PATCH(req: NextRequest) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let pendingOrderId: string | null = null
  try {
    const json = await req.json()
    const parsed = updateFulfillmentSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    pendingOrderId = parsed.data.id
    const isShipped = parsed.data.fulfillmentStatus === 'shipped'
    const order = await prisma.order.update({ where: { id: parsed.data.id }, data: { fulfillmentStatus: parsed.data.fulfillmentStatus, fulfilledAt: isShipped ? new Date() : null } })

    await recordAdminAuditLog({
      action: 'orders.fulfillment.update',
      resource: parsed.data.id,
      session,
      request: req,
      metadata: { fulfillmentStatus: parsed.data.fulfillmentStatus },
    })

    return NextResponse.json({ ok: true, order })
  } catch (error) {
    logger.error({ err: error, orderId: pendingOrderId }, '[orders] fulfillment update failed')
    await recordAdminAuditLog({
      action: 'orders.fulfillment.update',
      resource: pendingOrderId || 'unknown',
      session,
      request: req,
      status: 'error',
      metadata: {
        message: 'update_failed',
      },
    })
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }
}
