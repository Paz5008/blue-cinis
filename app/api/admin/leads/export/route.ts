import { NextRequest, NextResponse, after } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { ADMIN_EXPORT_LIMIT, buildLeadQuery, buildLeadsCsv, resolveLeadFilters } from '@/lib/adminFilters'
import { serializeExportJob } from '@/lib/adminExports'
import { logger } from '@/lib/logger'
import { persistAdminExportFile } from '@/lib/exportStorage'

export async function POST(req: NextRequest) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const filters = resolveLeadFilters(resolveFiltersFromBody(await req.json().catch(() => ({}))))
  const auditContext = cloneAuditContext(req)

  const job = await prisma.adminExportJob.create({
    data: {
      type: 'leads_csv',
      status: 'pending',
      filters: snapshotFilters(filters),
      triggeredById: typeof session.user?.id === 'string' ? session.user.id : null,
      triggeredByEmail: session.user?.email ?? null,
    },
  })

  await queueLeadExportJob(job.id, filters, session, auditContext, runExportsInline)

  return NextResponse.json({ job: serializeExportJob(job) })
}

function resolveFiltersFromBody(body: unknown): Record<string, string> {
  const raw: Record<string, string> = {}
  if (!body || typeof body !== 'object') return raw
  const candidate = (body as { filters?: Record<string, unknown> }).filters
  if (!candidate || typeof candidate !== 'object') return raw
  if (typeof candidate.q === 'string') raw.q = candidate.q
  if (typeof candidate.from === 'string') raw.from = candidate.from
  if (typeof candidate.to === 'string') raw.to = candidate.to
  if (typeof candidate.sort === 'string') raw.sort = candidate.sort
  if (typeof candidate.status === 'string') raw.status = candidate.status
  if (candidate.showSensitive) raw.sensitive = 'full'
  return raw
}

function snapshotFilters(filters: ReturnType<typeof resolveLeadFilters>): Prisma.JsonObject {
  return {
    q: filters.q || null,
    from: filters.from || null,
    to: filters.to || null,
    status: filters.status || null,
    sort: filters.sort,
    includeSensitive: filters.includeSensitive,
  }
}

const runExportsInline = process.env.NODE_ENV === 'test'

async function queueLeadExportJob(
  jobId: string,
  filters: ReturnType<typeof resolveLeadFilters>,
  session: NonNullable<Awaited<ReturnType<typeof ensureAdminSession>>>,
  auditContext: { headers: Headers; ip?: string | null },
  inline = false,
) {
  const execute = async () => {
    try {
      await runLeadExportJob(jobId, filters, session, auditContext)
    } catch (error) {
      logger.error({ jobId, error }, 'leads_export_job_unhandled')
    }
  }
  if (inline) {
    await execute()
    return
  }
  after(() => {
    execute()
  })
}

async function runLeadExportJob(
  jobId: string,
  filters: ReturnType<typeof resolveLeadFilters>,
  session: NonNullable<Awaited<ReturnType<typeof ensureAdminSession>>>,
  auditContext: { headers: Headers; ip?: string | null },
) {
  await prisma.adminExportJob.update({
    where: { id: jobId },
    data: { status: 'processing' },
  })
  const { where, orderBy } = buildLeadQuery(filters)

  try {
    const rows = await prisma.lead.findMany({
      where,
      orderBy,
      take: ADMIN_EXPORT_LIMIT,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        artworkId: true,
        artistId: true,
        createdAt: true,
      },
    })

    const csv = buildLeadsCsv(rows, { includeSensitive: filters.includeSensitive })
    const fileName = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    const mimeType = 'text/csv; charset=utf-8'
    const storedFile = await persistAdminExportFile({
      jobId,
      fileName,
      mimeType,
      buffer: Buffer.from(csv, 'utf-8'),
    })
    const updated = await prisma.adminExportJob.update({
      where: { id: jobId },
      data: {
        status: 'ready',
        readyAt: new Date(),
        fileName,
        fileMimeType: mimeType,
        fileSize: storedFile.size,
        fileChecksum: storedFile.checksum,
        fileStorageProvider: storedFile.provider,
        fileStorageKey: storedFile.key,
        fileStorageUrl: storedFile.url || null,
      },
    })

    await recordAdminAuditLog({
      action: 'leads.export.async',
      resource: jobId,
      session,
      request: auditContext,
      metadata: {
        filters: {
          q: Boolean(filters.q),
          from: Boolean(filters.from),
          to: Boolean(filters.to),
          status: filters.status || null,
        },
        sensitiveMode: filters.includeSensitive ? 'full' : 'masked',
        rows: rows.length,
      },
    })
    return updated
  } catch (error) {
    await prisma.adminExportJob.update({
      where: { id: jobId },
      data: { status: 'error', errorMessage: 'Génération impossible' },
    })
    await recordAdminAuditLog({
      action: 'leads.export.async',
      resource: jobId,
      session,
      request: auditContext,
      status: 'error',
    })
    throw error
  }
}

function cloneAuditContext(req: NextRequest) {
  const headers = new Headers(req.headers)
  const ip = (req as any)?.ip ?? null
  return { headers, ip }
}
