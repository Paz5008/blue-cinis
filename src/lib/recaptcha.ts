'use client'

type GrecaptchaExecutor = {
  ready(cb: () => void): void
  execute(siteKey: string, options: { action: string }): Promise<string>
}

type GrecaptchaGlobal = GrecaptchaExecutor & {
  enterprise?: GrecaptchaExecutor
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaGlobal
  }
}

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

function getClient(): GrecaptchaExecutor | null {
  if (typeof window === 'undefined') return null
  const base = window.grecaptcha
  if (!base) return null
  if (base.enterprise) return base.enterprise
  return base
}

export async function executeRecaptcha(action: string): Promise<string | null> {
  if (!siteKey) return null
  const client = getClient()
  if (!client?.ready || !client.execute) return null
  await new Promise<void>((resolve) => client.ready(resolve))
  try {
    return await client.execute(siteKey, { action })
  } catch {
    return null
  }
}

export function isRecaptchaAvailable() {
  return Boolean(siteKey && getClient())
}
