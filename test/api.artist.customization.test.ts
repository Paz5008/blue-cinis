import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth since ensureArtistSession uses auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    artist: { findUnique: vi.fn() },
    artistPage: { findUnique: vi.fn(), upsert: vi.fn() },
  }
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(() => { }),
  revalidateTag: vi.fn(() => { }),
}))

async function mKey() { return await import('../app/api/artist/customization/[key]/route') }

const payload = { blocks: [], theme: {}, settings: {} }
const validPayload = {
  blocks: [{ id: 'b1', type: 'text', content: '', style: {} }],
  theme: {},
  meta: { title: 'Profil artiste', description: '', canonicalUrl: 'https://example.com' },
  settings: {},
}

describe('API /api/artist/customization/[key]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects unauthenticated requests', async () => {
    const { GET, PUT } = await mKey()
    const getRes = await GET({ url: 'http://localhost', headers: new Headers() } as any, { params: { key: 'profile' } })
    expect(getRes.status).toBe(401)
    const putReq = { headers: new Headers({ 'content-type': 'application/json' }), async json() { return validPayload } } as any
    const putRes = await PUT(putReq, { params: { key: 'profile' } })
    expect(putRes.status).toBe(401)
  })

  it('GET returns draft for key', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', email: 'e@x', role: 'artist' } })
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'e@x' })
    prisma.artistPage.findUnique.mockResolvedValueOnce({ draftContent: { blocks: [] }, publishedContent: null, status: 'draft' })
    const { GET } = await mKey()
    const res = await GET({ url: 'http://localhost', headers: new Headers() } as any, { params: { key: 'poster' } })
    expect(res.status).toBe(200)
  })

  it('PUT [key] upserts draft for key', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', email: 'e@x', role: 'artist' } })
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'e@x' })
    prisma.artistPage.upsert.mockResolvedValueOnce({ draftContent: payload, status: 'draft' })
    const { PUT } = await mKey()
    const req = { headers: new Headers({ 'content-type': 'application/json' }), async json() { return validPayload } } as any
    const res = await PUT(req, { params: { key: 'poster' } })
    expect(res.status).toBe(200)
  })

  it('PUT [key]=profile publish triggers pending_review status (Validation Gate)', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', email: 'e@x', role: 'artist' } })
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'e@x', name: 'Test Artist' })
    prisma.artistPage.upsert.mockResolvedValueOnce({ draftContent: payload, status: 'pending_review', id: 'page1' })
    const { PUT } = await mKey()
    const publishPayload = { ...validPayload, action: 'publish' as const }
    const req = { headers: new Headers({ 'content-type': 'application/json' }), async json() { return publishPayload } } as any
    const res = await PUT(req, { params: { key: 'profile' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    // Validation Gate: No direct publish, status goes to pending_review
    expect(data._status).toBe('pending_review')
  })
})

