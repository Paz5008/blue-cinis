import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { maskEmail, maskPhone, redactLongText } from '@/lib/redact'
import { buildLeadQuery, resolveLeadFilters } from '@/lib/adminFilters'
import { describeMfaFailure, validateMfaToken } from '@/lib/mfa'

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
  const filters = resolveLeadFilters(rawParams)
  const includeSensitive = filters.includeSensitive
  if (includeSensitive) {
    const mfaCheck = await validateMfaToken({
      token: req.headers.get('x-admin-mfa-token'),
      userId: session.user.id,
      scope: 'leads.list',
      consume: false,
    })
    if (!mfaCheck.ok) {
      return NextResponse.json({ error: describeMfaFailure(mfaCheck.reason) }, { status: 403 })
    }
  }
  const effectiveFilters = { ...filters, includeSensitive }
  const { where, orderBy } = buildLeadQuery(effectiveFilters)

  const total = await prisma.lead.count({ where })
  const rows = await prisma.lead.findMany({
    where,
    orderBy,
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      artworkId: true,
      artistId: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      lastContactedAt: true,
      nextFollowUpAt: true,
      nextFollowUpNote: true,
    },
  })
  const items = includeSensitive
    ? rows
    : rows.map((lead) => ({
      ...lead,
      email: maskEmail(lead.email),
      phone: maskPhone(lead.phone),
      message: redactLongText(lead.message),
    }))

  await recordAdminAuditLog({
    action: 'leads.list',
    resource: `lead?page=${filters.page}`,
    session,
    request: req,
    metadata: {
      filters: {
        q: Boolean(filters.q),
        from: Boolean(filters.from),
        to: Boolean(filters.to),
        status: filters.status || null,
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
