import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { subscribeToNewsletter, NewsletterError } from '@/lib/newsletter'
import { bannerCtaLimiter, getIpFromHeaders } from '@/lib/ratelimit'
import { getRequestId } from '@/lib/req'
import { logger } from '@/lib/logger'

const payloadSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
})

export async function POST(req: NextRequest) {
  const rid = getRequestId(req.headers as any)
  try {
    if (bannerCtaLimiter) {
      const ip = getIpFromHeaders(req.headers)
      const attempt = await bannerCtaLimiter.limit(`newsletter:${ip}`)
      if (!attempt.success) {
        const retryAfter = Math.max(1, Math.ceil((attempt.reset - Date.now()) / 1000))
        return NextResponse.json(
          { error: 'Trop de tentatives, réessayez plus tard.' },
          { status: 429, headers: { 'Retry-After': retryAfter.toString() } },
        )
      }
    }

    const body = await req.json().catch(() => ({}))
    const parsed = payloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const result = await subscribeToNewsletter(parsed.data.email)
    logger.info({ rid, email: parsed.data.email, alreadySubscribed: result.alreadySubscribed }, '[newsletter] subscribed')
    return NextResponse.json({ ok: true, alreadySubscribed: Boolean(result.alreadySubscribed) }, { status: result.alreadySubscribed ? 200 : 201 })
  } catch (error) {
    if (error instanceof NewsletterError) {
      if (error.code === 'invalid_email') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.code === 'not_configured') {
        logger.error({ rid, message: error.message }, '[newsletter] provider missing')
        return NextResponse.json({ error: 'Service indisponible' }, { status: 503 })
      }
      logger.error({ rid, message: error.message }, '[newsletter] provider error')
      return NextResponse.json({ error: 'Inscription impossible pour le moment.' }, { status: 502 })
    }
    logger.error({ rid, err: error }, '[newsletter] unexpected failure')
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
