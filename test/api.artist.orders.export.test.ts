import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/prisma', () => ({ prisma: { artist: { findUnique: vi.fn() }, order: { findMany: vi.fn() } } }))

async function getHandler() { const mod = await import('../app/api/artist/orders/export/route'); return mod.GET }

function makeReq(url = 'http://localhost/api/artist/orders/export') {
  return { url, headers: new Headers() } as any
}

describe('GET /api/artist/orders/export', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 if not artist', async () => {
    const GET = await getHandler()
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('returns CSV for artist', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1' })
    prisma.order.findMany.mockResolvedValueOnce([
      { id: 'o1', createdAt: new Date('2025-01-01T00:00:00Z'), status: 'paid', artworkId: 'a1', buyerEmail: 'b@example.com', amount: 1000, currency: 'eur', fee: 70, net: 930, stripeSessionId: 'cs_1', paymentIntentId: 'pi_1' },
    ])
    const GET = await getHandler()
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')||'').toMatch(/text\/csv/)
    const text = await res.text()
    expect(text.split('\n').length).toBeGreaterThan(1)
  })
})
