import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import {
  CACHE_REVALIDATION_SCRIPTS,
  collectRevalidationTargets,
  resolveRevalidationScript,
} from '@/lib/cacheTags'
import { logger } from '@/lib/logger'

export async function GET() {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const scripts = CACHE_REVALIDATION_SCRIPTS.map((script) => {
    const targets = collectRevalidationTargets(script)
    return {
      id: script.id,
      label: script.label,
      description: script.description,
      tags: targets.tags,
      paths: targets.paths,
    }
  })
  return NextResponse.json({ scripts })
}

export async function POST(req: NextRequest) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const payload = await req.json().catch(() => null)
  const scriptId = typeof payload?.scriptId === 'string' ? payload.scriptId : ''
  const script = resolveRevalidationScript(scriptId)
  if (!script) {
    return NextResponse.json({ error: 'Script introuvable' }, { status: 400 })
  }
  const targets = collectRevalidationTargets(script)
  try {
    await Promise.all([
      ...targets.tags.map((tag) => revalidateTag(tag)),
      ...targets.paths.map((path) => revalidatePath(path)),
    ])
  } catch (error) {
    logger.error({ err: error, scriptId }, '[cache] revalidation script failed')
    await recordAdminAuditLog({
      action: 'cache.revalidate.script',
      resource: script.id,
      session,
      request: req,
      status: 'error',
    })
    return NextResponse.json({ error: 'Revalidation impossible' }, { status: 500 })
  }

  await recordAdminAuditLog({
    action: 'cache.revalidate.script',
    resource: script.id,
    session,
    request: req,
    metadata: {
      tags: targets.tags,
      paths: targets.paths,
    },
  })

  return NextResponse.json({
    script: {
      id: script.id,
      label: script.label,
      description: script.description,
    },
    tags: targets.tags,
    paths: targets.paths,
    executedAt: new Date().toISOString(),
  })
}
