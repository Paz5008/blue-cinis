import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { serializeExportJob } from '@/lib/adminExports'

export async function GET(req: NextRequest) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const url = new URL(req.url)
  const type = url.searchParams.get('type') ?? undefined
  const limitParam = parseInt(url.searchParams.get('limit') || '10', 10)
  const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 10
  const jobs = await prisma.adminExportJob.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: 'desc' },
    take,
  })
  return NextResponse.json({ jobs: jobs.map(serializeExportJob) })
}
