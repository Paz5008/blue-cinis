import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { startMfaChallenge, describeMfaFailure, MfaError } from '@/lib/mfa'

const payloadSchema = z.object({
  scope: z.string().trim().min(2).max(120),
})

export async function POST(req: NextRequest) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await req.json().catch(() => null)
  const parsed = payloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Scope requis' }, { status: 400 })
  }
  const scope = parsed.data.scope
  try {
    const result = await startMfaChallenge({
      userId: session.user?.id || '',
      email: session.user?.email,
      scope,
      actorEmail: session.user?.email,
    })
    await recordAdminAuditLog({
      action: 'mfa.challenge',
      resource: scope,
      session,
      request: req,
      metadata: { delivery: result.delivery.channel, masked: result.delivery.maskedDestination },
    })
    return NextResponse.json(result)
  } catch (error) {
    const reason = error instanceof MfaError ? error.code : 'unknown'
    await recordAdminAuditLog({
      action: 'mfa.challenge',
      resource: scope,
      session,
      request: req,
      status: 'error',
      metadata: { reason },
    })
    const message = error instanceof MfaError ? error.message : describeMfaFailure()
    const status = error instanceof MfaError ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
