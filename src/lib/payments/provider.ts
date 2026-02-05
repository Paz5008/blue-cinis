import { env } from '@/env'
import { logger } from '@/lib/logger'

export type ProviderName = 'stripe' | 'paypal' | 'adyen' | 'mollie'

const SUPPORTED_PROVIDERS: ProviderName[] = ['stripe']

export function getDefaultProvider(): ProviderName {
  const requested = (env.PAYMENTS_PROVIDER || 'stripe').toLowerCase() as ProviderName
  if (!SUPPORTED_PROVIDERS.includes(requested)) {
    const message = `[payments] Provider "${requested}" is not available. Supported: ${SUPPORTED_PROVIDERS.join(', ')}`
    logger.error(message)
    throw new Error(message)
  }
  return requested
}
