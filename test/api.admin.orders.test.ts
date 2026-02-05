import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/authz', () => ({ isAdmin: vi.fn(() => false) }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { count: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    artwork: { findMany: vi.fn() }
  }
}))

async function getModule() {
  return await import('../app/api/admin/orders/route')
}

const makeReq = (url = 'http://localhost/api/admin/orders') => ({ url, headers: new Headers(), async json() { return {} } }) as any

describe('API /api/admin/orders', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('GET returns 403 when not admin', async () => {
    const { GET } = await getModule()
    const res = await GET(makeReq())
    expect(res.status).toBe(403)
  })

  it('GET returns orders for admin', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prisma.order.count.mockResolvedValueOnce(1)
    prisma.order.findMany.mockResolvedValueOnce([{ id: 'o1', artworkId: 'a1' }])
    prisma.artwork.findMany.mockResolvedValueOnce([{ id: 'a1', title: 'Test Artwork' }])
    const { GET } = await getModule()
    const res = await GET(makeReq('http://localhost/api/admin/orders?page=1&pageSize=10'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.total).toBe(1)
    expect(data.items[0].id).toBe('o1')
  })

  it('PATCH updates fulfillment status and sets fulfilledAt when shipped', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    const order = { id: 'o1', fulfillmentStatus: 'shipped', fulfilledAt: new Date() }
    prisma.order.update.mockResolvedValueOnce(order)
    const { PATCH } = await getModule()
    const req = { url: 'http://localhost/api/admin/orders', headers: new Headers(), async json() { return { id: 'o1', fulfillmentStatus: 'shipped' } } } as any
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.order.fulfillmentStatus).toBe('shipped')
  })
})

