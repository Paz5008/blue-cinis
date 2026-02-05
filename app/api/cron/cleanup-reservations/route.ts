import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredReservations } from '@/jobs/cleanupReservations'
import { env } from '@/env'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const secret = env.CRON_CLEANUP_SECRET
  const providedSecret = req.headers.get('x-cron-secret')
  const isVercelCron = Boolean(req.headers.get('x-vercel-cron'))

  if (secret) {
    if (providedSecret !== secret && !isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (!isVercelCron) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await cleanupExpiredReservations()
  logger.info({ source: 'cron.cleanup', ...result }, '[cron] reservations cleanup executed')
  return NextResponse.json({ ok: true, ...result }, { status: 200 })
}
