import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/prisma', () => ({ prisma: {
  artist: { findUnique: vi.fn() },
  lead: { findMany: vi.fn() },
  artwork: { findMany: vi.fn() },
} }))

async function getHandler() { const mod = await import('../app/api/artist/leads/export/route'); return mod.GET }

const makeReq = () => ({ url: 'http://localhost/api/artist/leads/export', headers: new Headers() }) as any

describe('GET /api/artist/leads/export', () => {
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
    prisma.lead.findMany.mockResolvedValueOnce([{ id: 'l1', createdAt: new Date('2025-01-01T00:00:00Z'), name: 'N', email: 'e', phone: '', artworkId: 'a1' }])
    prisma.artwork.findMany.mockResolvedValueOnce([{ id: 'a1', title: 'T' }])
    const GET = await getHandler()
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')||'').toMatch(/text\/csv/)
    const text = await res.text()
    expect(text.split('\n').length).toBeGreaterThan(1)
  })
})
