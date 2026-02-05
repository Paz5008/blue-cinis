import { headers } from 'next/headers'
import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { prisma } from '@/lib/prisma'
import { maskEmail, maskName, maskPhone } from '@/lib/redact'
import { recordAdminAuditLog } from '@/lib/audit'
import type { OrderOpsStatus } from '@/lib/workflows'
import { buildOrderQuery, resolveOrderFilters } from '@/lib/adminFilters'
import OrdersClient from './_components/OrdersClient'
import { validateMfaToken } from '@/lib/mfa'

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireAdminSessionOrRedirect('/admin/orders')
  const incomingHeaders = await headers()
  const auditHeaders = new Headers()
  incomingHeaders.forEach((value, key) => auditHeaders.append(key, value))

  const filters = resolveOrderFilters(searchParams)
  let includeSensitive = filters.includeSensitive
  if (includeSensitive) {
    const mfaResult = await validateMfaToken({
      token: incomingHeaders.get('x-admin-mfa-token'),
      userId: session.user.id,
      scope: 'orders.list',
      consume: false,
    })
    if (!mfaResult.ok) {
      includeSensitive = false
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
    select: {
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
    },
  })

  // Fetch artwork titles manually since Order doesn't have a direct relation in schema
  const artworkIds = Array.from(new Set(rows.map((r) => r.artworkId)))
  const artworks = await prisma.artwork.findMany({
    where: { id: { in: artworkIds } },
    select: { id: true, title: true },
  })
  const artworkMap = new Map(artworks.map((a) => [a.id, a]))

  const items = rows.map((order) => {
    const artwork = artworkMap.get(order.artworkId)
    const masked = includeSensitive
      ? order
      : {
        ...order,
        buyerEmail: maskEmail(order.buyerEmail),
        buyerPhone: maskPhone(order.buyerPhone),
        buyerName: maskName(order.buyerName),
        billingAddress: null,
        shippingAddress: null,
      }
    return {
      ...masked,
      shippingAddressPresent: Boolean(order.shippingAddress),
      billingAddressPresent: Boolean(order.billingAddress),
      opsStatus: (order.opsStatus as OrderOpsStatus) ?? 'backoffice_pending',
      createdAt: order.createdAt.toISOString(),
      fulfilledAt: order.fulfilledAt ? order.fulfilledAt.toISOString() : null,
      nextActionAt: order.nextActionAt ? order.nextActionAt.toISOString() : null,
      artworkTitle: artwork?.title ?? null,
    }
  })

  await recordAdminAuditLog({
    action: 'orders.list',
    resource: `orders?page=${filters.page}`,
    session,
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
    request: { headers: auditHeaders },
  })

  return (
    <OrdersClient
      data={{ page: filters.page, pageSize: filters.pageSize, total, items, sensitiveMode: includeSensitive ? 'full' : 'masked' }}
      filters={{
        q: filters.q,
        status: filters.status,
        opsStatus: filters.opsStatus,
        fulfillment: filters.fulfillment,
        from: filters.from,
        to: filters.to,
        sort: filters.sort,
        showSensitive: includeSensitive,
      }}
    />
  )
}
