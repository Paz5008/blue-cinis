import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/authz', () => ({ isAdmin: vi.fn(() => false) }))
vi.mock('@/lib/prisma', () => ({ prisma: { artwork: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() } } }))

async function mList() { return await import('../app/api/admin/artworks/route') }
async function mItem() { return await import('../app/api/admin/artworks/[id]/route') }

const makeReq = (url = 'http://localhost/api/admin/artworks?page=1&pageSize=10&q=') => ({ url, headers: new Headers() }) as any

describe('API /api/admin/artworks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET list forbids non-admin', async () => {
    const { GET } = await mList()
    const res = await GET(makeReq())
    expect(res.status).toBe(403)
  })

  it('GET list returns items for admin', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prisma.artwork.count.mockResolvedValueOnce(1)
    prisma.artwork.findMany.mockResolvedValueOnce([{ id: 'a1', title: 'T', price: 1000, imageUrl: '/x', artistName: 'A' }])
    const { GET } = await mList()
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.total).toBe(1)
  })

  it('GET item returns 404 if not found', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prisma.artwork.findUnique.mockResolvedValueOnce(null)
    const { GET } = await mItem()
    const res = await GET(makeReq('http://localhost/api/admin/artworks/a1'), { params: { id: 'a1' } })
    expect(res.status).toBe(404)
  })

  it('GET item returns data when found', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prisma.artwork.findUnique.mockResolvedValueOnce({ id: 'a1', title: 'T', price: 1000, imageUrl: '/x', artistName: 'A' })
    const { GET } = await mItem()
    const res = await GET(makeReq('http://localhost/api/admin/artworks/a1'), { params: { id: 'a1' } })
    expect(res.status).toBe(200)
  })
})

