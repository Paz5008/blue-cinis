import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/authz', () => ({ isAdmin: vi.fn(() => false) }))
vi.mock('@/lib/prisma', () => ({ prisma: { artist: { findMany: vi.fn(), update: vi.fn() } } }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

async function mList() { return await import('../app/api/admin/artists/route') }
async function mToggle() { return await import('../app/api/admin/artists/[id]/route') }
async function mFeatured() { return await import('../app/api/admin/artists/[id]/featured/route') }

describe('API /api/admin/artists', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET list forbids non-admin', async () => {
    const { GET } = await mList()
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('GET list returns artists for admin', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prisma.artist.findMany.mockResolvedValueOnce([{ id: 'ar1', name: 'A', isActive: true, isFeatured: false }])
    const { GET } = await mList()
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data[0].id).toBe('ar1')
  })

  it('PATCH /[id] updates isActive', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prisma.artist.update.mockResolvedValueOnce({ id: 'ar1', isActive: false })
    const { PATCH } = await mToggle()
    const req = { url: 'http://localhost/api/admin/artists/ar1', headers: new Headers(), async json() { return { isActive: false } } } as any
    const res = await PATCH(req, { params: { id: 'ar1' } })
    expect(res.status).toBe(200)
  })

  it('PUT /[id]/featured updates isFeatured', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prisma.artist.update.mockResolvedValueOnce({ id: 'ar1', isFeatured: true })
    const { PUT } = await mFeatured()
    const req = { url: 'http://localhost/api/admin/artists/ar1/featured', headers: new Headers(), async json() { return { isFeatured: true } } } as any
    const res = await PUT(req, { params: { id: 'ar1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.isFeatured).toBe(true)
  })
})

