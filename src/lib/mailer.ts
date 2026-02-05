import { env } from '../env'
import { logger } from './logger'

type MailInput = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

export type MailResult =
  | { ok: true }
  | { ok: false; skipped?: boolean; error: string }

function isConfigured() {
  return !!(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS)
}

let _transporter: any | null = null
const isProd = env.NODE_ENV === 'production'

export class MailerError extends Error {
  constructor(
    public code: 'CONFIG_MISSING' | 'SEND_FAILED',
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'MailerError'
  }
}

async function getTransport() {
  if (!isConfigured()) {
    if (isProd) {
      throw new MailerError('CONFIG_MISSING', 'SMTP transport is not configured')
    }
    return null
  }
  if (_transporter) return _transporter
  const nodemailer = (await import('nodemailer')).default as any
  _transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: env.SMTP_SECURE === 'true',
    requireTLS: true,
    auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
  })
  return _transporter
}

export const mailer = {
  isConfigured,
  async send(input: MailInput): Promise<MailResult> {
    try {
      const transporter = await getTransport()
      if (!transporter) {
        logger.warn({ to: input.to, subject: input.subject }, '[mailer] transport unavailable; skipping send')
        return { ok: false, skipped: true, error: 'SMTP transport unavailable' }
      }
      const from = input.from || env.SMTP_USER || 'no-reply@example.com'
      await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      })
      return { ok: true }
    } catch (e) {
      if (e instanceof MailerError) {
        logger.error({ err: e, code: e.code }, '[mailer] configuration error')
        throw e
      }
      logger.error({ err: e, to: input.to, subject: input.subject }, '[mailer] send failed')
      if (isProd) {
        throw new MailerError('SEND_FAILED', 'Failed to send email', { cause: e as any })
      }
      return { ok: false, error: 'Failed to send email' }
    }
  },
}

export type Mailer = typeof mailer
