import { prisma } from '@/lib/prisma'

export type SafeResult<T> = { ok: true; data: T } | { ok: false; data: T; error: any };

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL || ''
  if (!url) return false
  if (/HOST:5432/i.test(url)) return false
  return true
}

export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<SafeResult<T>> {
  if (!isDbConfigured()) return { ok: false, data: fallback, error: 'DB_URL_INVALID' }
  try {
    const data = await fn();
    return { ok: true, data }
  } catch (e) {
    return { ok: false, data: fallback, error: e }
  }
}

export { prisma }
