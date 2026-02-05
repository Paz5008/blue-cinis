import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { verifyMfaChallenge, MfaError } from '@/lib/mfa'

const payloadSchema = z.object({
  challengeId: z.string().min(8),
  code: z.string().trim().min(3).max(10),
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
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }
  const { challengeId, code, scope } = parsed.data
  try {
    const result = await verifyMfaChallenge({
      challengeId,
      code,
      userId: session.user?.id || '',
      scope,
    })
    await recordAdminAuditLog({
      action: 'mfa.verify',
      resource: scope,
      session,
      request: req,
      metadata: { challengeId },
    })
    return NextResponse.json(result)
  } catch (error) {
    const status = error instanceof MfaError ? 409 : 500
    await recordAdminAuditLog({
      action: 'mfa.verify',
      resource: scope,
      session,
      request: req,
      status: 'denied',
      metadata: { challengeId, reason: error instanceof MfaError ? error.code : 'unknown' },
    })
    const message = error instanceof MfaError ? error.message : 'Validation impossible'
    return NextResponse.json({ error: message }, { status })
  }
}
