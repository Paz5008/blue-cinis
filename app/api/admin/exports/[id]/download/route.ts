import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { readAdminExportFile } from '@/lib/exportStorage'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const job = await prisma.adminExportJob.findUnique({ where: { id: params.id } })
  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (
    job.status !== 'ready' ||
    !job.fileStorageKey ||
    !job.fileStorageProvider
  ) {
    return NextResponse.json({ error: 'Export pas encore prêt' }, { status: 409 })
  }
  try {
    const payload = await readAdminExportFile({
      provider: job.fileStorageProvider,
      key: job.fileStorageKey,
      url: job.fileStorageUrl,
    })
    const filename = job.fileName || `${job.type}-${job.id}.csv`
    const mime = job.fileMimeType || 'text/csv; charset=utf-8'
    return new NextResponse(payload, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[admin.exports.download] unable to read file', error)
    return NextResponse.json({ error: 'Export indisponible' }, { status: 410 })
  }
}
