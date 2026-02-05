import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/env'
import { logger } from '@/lib/logger'

const hasUpstashEnv = Boolean(
  env.UPSTASH_REDIS_REST_URL &&
  env.UPSTASH_REDIS_REST_TOKEN &&
  !env.UPSTASH_REDIS_REST_URL.includes('example')
)
if (!hasUpstashEnv) {
  const message = '[ratelimit] Upstash Redis env missing; falling back to in-memory limiters'
  // if (env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION !== 'true') {
  //   throw new Error(message)
  // }
  logger.warn(message)
}

const redis = hasUpstashEnv
  ? new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  })
  : undefined

export const sharedRedis = redis

const buildLimiter = (max: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) =>
  redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(max, window) }) : undefined

export const leadsLimiter = buildLimiter(5, '1 m')
export const uploadsLimiter = buildLimiter(10, '1 m')
export const authLimiterIp = buildLimiter(20, '10 m')
export const authLimiterEmail = buildLimiter(10, '10 m')
export const artistRegistrationLimiter = buildLimiter(5, '1 m')
export const clientRegistrationLimiter = buildLimiter(5, '1 m')
export const bannerCtaLimiter = buildLimiter(80, '1 m')

export function getIpFromHeaders(h: Headers) {
  const xff = h.get('x-forwarded-for');
  if (!xff) return 'unknown';
  return xff.split(',')[0].trim() || 'unknown';
}
export const checkoutLimiter = buildLimiter(10, '1 m')
