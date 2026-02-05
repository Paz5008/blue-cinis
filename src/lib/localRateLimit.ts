type Bucket = { count: number; resetAt: number }

export type LocalLimiterResult = { success: boolean; reset: number }

export function createInMemorySlidingWindowLimiter(options: { max: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>()
  const { max, windowMs } = options

  return {
    limit(identifier: string): LocalLimiterResult {
      const now = Date.now()
      const bucket = buckets.get(identifier)

      if (!bucket || bucket.resetAt <= now) {
        const resetAt = now + windowMs
        buckets.set(identifier, { count: 1, resetAt })
        return { success: true, reset: resetAt }
      }

      if (bucket.count >= max) {
        return { success: false, reset: bucket.resetAt }
      }

      bucket.count += 1
      return { success: true, reset: bucket.resetAt }
    },
  }
}
