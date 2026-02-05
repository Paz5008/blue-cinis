import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/prisma', () => ({ prisma: { artist: { findUnique: vi.fn(), update: vi.fn() } } }))

async function getModule() {
  return await import('../app/api/artist/profile/route')
}

function makeGET(url = 'http://localhost/api/artist/profile') {
  return { url, headers: new Headers() } as any
}

function makePUT(form: Record<string, string>) {
  const fd = new FormData()
  for (const [k,v] of Object.entries(form)) fd.append(k, v)
  return { headers: new Headers(), async formData() { return fd } } as any
}

describe('API /api/artist/profile', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('GET returns 401 when not artist', async () => {
    const { GET } = await getModule()
    const res = await GET(makeGET())
    expect(res.status).toBe(401)
  })

  it('GET returns artist data', async () => {
    const { auth } = await import('@/auth') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    const { prisma } = await import('@/lib/prisma') as any
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'a1', name: 'X', slug: 'x' })
    const { GET } = await getModule()
    const res = await GET(makeGET())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('a1')
  })

  it('PUT updates artist basic fields', async () => {
    const { auth } = await import('@/auth') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    const { prisma } = await import('@/lib/prisma') as any
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'a1', photoUrl: null })
    prisma.artist.update.mockResolvedValueOnce({ id: 'a1', name: 'John' })
    const { PUT } = await getModule()
    const res = await PUT(makePUT({ name: 'John' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('John')
  })
})
