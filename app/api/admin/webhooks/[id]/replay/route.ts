import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { ensureAdminSession } from '@/lib/adminGuard'
import { prisma } from '@/lib/prisma'
import { validateMfaToken, describeMfaFailure } from '@/lib/mfa'
import { processStripeWebhookEvent } from '@/lib/payments/webhooks'
import { recordAdminAuditLog } from '@/lib/audit'
import { getRequestId } from '@/lib/req'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const rid = getRequestId(req.headers as any)
  const tokenCheck = await validateMfaToken({
    token: req.headers.get('x-admin-mfa-token'),
    userId: session.user?.id || null,
    scope: 'webhooks.replay',
  })
  if (!tokenCheck.ok) {
    await recordAdminAuditLog({
      action: 'webhooks.replay',
      resource: params.id,
      session,
      request: req,
      status: 'denied',
      metadata: { reason: 'mfa_failed', detail: tokenCheck.reason },
    })
    return NextResponse.json({ error: describeMfaFailure(tokenCheck.reason) }, { status: 412 })
  }

  const eventRecord = await prisma.webhookEvent.findUnique({
    where: { id: params.id },
  })
  if (!eventRecord) {
    return NextResponse.json({ error: 'Webhook introuvable' }, { status: 404 })
  }
  if (eventRecord.provider !== 'stripe') {
    return NextResponse.json({ error: `Replay non supporte pour ${eventRecord.provider}` }, { status: 501 })
  }

  const payload = eventRecord.payload as Stripe.Event | null
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 500 })
  }

  try {
    const report = await processStripeWebhookEvent(payload, { rid })
    await recordAdminAuditLog({
      action: 'webhooks.replay',
      resource: params.id,
      session,
      request: req,
      metadata: { provider: eventRecord.provider, type: eventRecord.type, handled: report.handled },
    })
    return NextResponse.json({
      ok: true,
      provider: eventRecord.provider,
      type: eventRecord.type,
      handled: report.handled,
    })
  } catch (error) {
    logger.error({ err: error, rid, eventId: eventRecord.id }, '[webhooks] replay failed')
    await recordAdminAuditLog({
      action: 'webhooks.replay',
      resource: params.id,
      session,
      request: req,
      status: 'error',
      metadata: { provider: eventRecord.provider, type: eventRecord.type },
    })
    return NextResponse.json({ error: 'Rejeu impossible' }, { status: 500 })
  }
}
