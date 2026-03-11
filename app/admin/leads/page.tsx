import { headers } from 'next/headers'
import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { prisma } from '@/lib/prisma'
import { maskEmail, maskPhone, redactLongText } from '@/lib/redact'
import { recordAdminAuditLog } from '@/lib/audit'
import LeadsClient from './_components/LeadsClient'
import { buildLeadQuery, resolveLeadFilters } from '@/lib/adminFilters'
import type { LeadWorkflowStatus } from '@/lib/workflows'
import { validateMfaToken } from '@/lib/mfa'
import { serializeExportJob } from '@/lib/adminExports'

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireAdminSessionOrRedirect('/admin/leads')
  const incomingHeaders = await headers()
  const auditHeaders = new Headers()
  incomingHeaders.forEach((value, key) => auditHeaders.append(key, value))

  const filters = resolveLeadFilters(searchParams)
  let includeSensitive = filters.includeSensitive
  if (includeSensitive) {
    const mfaCheck = await validateMfaToken({
      token: incomingHeaders.get('x-admin-mfa-token'),
      userId: session.user.id,
      scope: 'leads.list',
      consume: false,
    })
    if (!mfaCheck.ok) {
      includeSensitive = false
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
  const items = rows.map((lead) => {
    const base = {
      ...lead,
      status: lead.status as LeadWorkflowStatus,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      lastContactedAt: lead.lastContactedAt ? lead.lastContactedAt.toISOString() : null,
      nextFollowUpAt: lead.nextFollowUpAt ? lead.nextFollowUpAt.toISOString() : null,
    }
    if (includeSensitive) {
      return base
    }
    return {
      ...base,
      email: maskEmail(lead.email),
      phone: maskPhone(lead.phone),
      message: redactLongText(lead.message),
    }
  })

  // Fetch initial export jobs
  const rawJobs = await prisma.adminExportJob.findMany({
    where: { type: 'leads_csv' },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })
  const initialExportJobs = rawJobs.map(serializeExportJob)

  await recordAdminAuditLog({
    action: 'leads.list',
    resource: `lead?page=${filters.page}`,
    session,
    metadata: {
      filters: { q: Boolean(filters.q), from: Boolean(filters.from), to: Boolean(filters.to), status: filters.status || null },
      sensitiveMode: includeSensitive ? 'full' : 'masked',
      pageSize: filters.pageSize,
    },
    request: { headers: auditHeaders },
  })

  return (
    <LeadsClient
      data={{ page: filters.page, pageSize: filters.pageSize, total, items, sensitiveMode: includeSensitive ? 'full' : 'masked' }}
      filters={{
        q: filters.q,
        from: filters.from,
        to: filters.to,
        status: filters.status,
        sort: filters.sort,
        showSensitive: includeSensitive,
      }}
      initialExportJobs={initialExportJobs}
    />
  )
}
