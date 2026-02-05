import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/authz', () => ({ isAdmin: vi.fn(() => false) }))
const prismaMocks = { order: { findUnique: vi.fn(), update: vi.fn() } }
vi.mock('@/lib/prisma', () => ({ prisma: prismaMocks }))
vi.mock('@/lib/audit', () => ({ recordAdminAuditLog: vi.fn(async () => undefined) }))

class FakeStripe {
  refunds = { create: vi.fn(async () => ({ id: 're_1' })) }
  constructor(_: string, __: any) { }
}
vi.mock('stripe', () => ({ default: FakeStripe }))

async function getHandler() {
  const mod = await import('../app/api/orders/[id]/refund/route')
  return mod.POST
}

function makeReq(body: any = { reason: 'Client request test' }) {
  return {
    url: 'http://localhost/api/orders/x/refund',
    headers: new Headers(),
    json: async () => body,
  } as any
}

describe('POST /api/orders/[id]/refund', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { delete process.env.STRIPE_SECRET_KEY })

  it('returns 403 when not admin', async () => {
    const POST = await getHandler()
    const res = await POST(makeReq(), { params: { id: 'o1' } })
    expect(res.status).toBe(403)
  })

  it('returns 404 when order not found', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prismaMocks.order.findUnique.mockResolvedValueOnce(null)
    const POST = await getHandler()
    const res = await POST(makeReq(), { params: { id: 'o1' } })
    expect(res.status).toBe(404)
  })

  it('returns 400 when missing paymentIntentId', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prismaMocks.order.findUnique.mockResolvedValueOnce({ id: 'o1', paymentIntentId: null, status: 'paid' })
    const POST = await getHandler()
    const res = await POST(makeReq(), { params: { id: 'o1' } })
    expect(res.status).toBe(400)
  })

  it('returns 500 when stripe not configured', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prismaMocks.order.findUnique.mockResolvedValueOnce({ id: 'o1', paymentIntentId: 'pi_1', status: 'paid' })
    delete process.env.STRIPE_SECRET_KEY
    const POST = await getHandler()
    const res = await POST(makeReq(), { params: { id: 'o1' } })
    expect(res.status).toBe(500)
  })

  it('refunds and updates order status', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    prismaMocks.order.findUnique.mockResolvedValueOnce({ id: 'o1', paymentIntentId: 'pi_1', status: 'paid' })
    prismaMocks.order.update.mockResolvedValueOnce({ id: 'o1', status: 'refunded' })
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    const POST = await getHandler()
    const res = await POST(makeReq(), { params: { id: 'o1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})

