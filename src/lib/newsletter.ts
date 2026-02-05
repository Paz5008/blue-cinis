import { env } from '@/env'
import { logger } from '@/lib/logger'

export type NewsletterResult = { ok: true; alreadySubscribed?: boolean }

export class NewsletterError extends Error {
  constructor(
    public code: 'invalid_email' | 'not_configured' | 'provider_error',
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'NewsletterError'
  }
}

const provider = (env.NEWSLETTER_PROVIDER || '').toLowerCase()

export async function subscribeToNewsletter(email: string): Promise<NewsletterResult> {
  if (!email) {
    throw new NewsletterError('invalid_email', 'Adresse email requise.')
  }
  if (provider !== 'brevo') {
    throw new NewsletterError('not_configured', 'Newsletter provider not configured.')
  }
  return subscribeWithBrevo(email)
}

async function subscribeWithBrevo(email: string): Promise<NewsletterResult> {
  if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
    throw new NewsletterError('not_configured', 'Brevo configuration is missing.')
  }
  const listId = Number(env.BREVO_LIST_ID)
  if (!Number.isFinite(listId)) {
    throw new NewsletterError('not_configured', 'BREVO_LIST_ID doit être un identifiant numérique.')
  }

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
    }),
    cache: 'no-store',
  })

  if (response.ok || response.status === 201) {
    return { ok: true }
  }

  const payload = await response.json().catch(() => ({}))
  const code = typeof payload?.code === 'string' ? payload.code.toLowerCase() : ''
  if (response.status === 400 && code.includes('duplicate')) {
    return { ok: true, alreadySubscribed: true }
  }

  logger.error({ provider: 'brevo', status: response.status, payload }, '[newsletter] provider error')
  throw new NewsletterError('provider_error', payload?.message || 'Brevo subscription failed.')
}
