

import { env } from '@/env'
import { logger } from '@/lib/logger'

const isProd = env.NODE_ENV === 'production'

type VerifyOptions = {
  token?: string | null
  manualBypass?: boolean
  rid?: string
  scope?: string
  allowDevBypass?: boolean
}

export async function verifyServerRecaptcha(options: VerifyOptions = {}): Promise<boolean> {
  const {
    token,
    manualBypass = false,
    rid,
    scope = 'recaptcha',
    allowDevBypass = true,
  } = options

  if (!isProd && manualBypass) {
    return true
  }

  const secret = env.RECAPTCHA_SECRET_KEY || ''
  if (!secret) {
    return !isProd && allowDevBypass
  }
  if (!token) {
    return false
  }
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = await res.json()
    const success = Boolean(data.success)
    if (!success) {
      logger.warn({ rid, scope, data }, '[recaptcha] verification rejected')
    }
    return success
  } catch (error) {
    logger.error({ rid, scope, err: error }, '[recaptcha] verification error')
    return !isProd && allowDevBypass
  }
}

export function isRecaptchaRequired(): boolean {
  return env.NODE_ENV === 'production'
}
