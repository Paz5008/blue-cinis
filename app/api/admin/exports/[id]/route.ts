import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { serializeExportJob } from '@/lib/adminExports'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const job = await prisma.adminExportJob.findUnique({ where: { id: params.id } })
  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ job: serializeExportJob(job) })
}
