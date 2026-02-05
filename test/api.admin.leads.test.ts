import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/authz', () => ({ isAdmin: vi.fn(() => false) }))
vi.mock('@/lib/prisma', () => ({ prisma: { lead: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) } } }))

async function getHandler() {
  const mod = await import('../app/api/admin/leads/route')
  return mod.GET
}

function makeReq(url = 'http://localhost/api/admin/leads?page=1&pageSize=10&q=') {
  return { url, headers: new Headers() } as any
}

describe('GET /api/admin/leads', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 403 when user is not admin', async () => {
    const GET = await getHandler()
    const res = await GET(makeReq())
    expect(res.status).toBe(403)
  })

  it('returns paginated leads when admin', async () => {
    const { auth } = await import('@/auth') as any
    const { isAdmin } = await import('@/lib/authz') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } })
    isAdmin.mockReturnValueOnce(true)
    const { prisma } = await import('@/lib/prisma') as any
    prisma.lead.count.mockResolvedValueOnce(2)
    prisma.lead.findMany.mockResolvedValueOnce([{ id: 'l1' }, { id: 'l2' }])

    const GET = await getHandler()
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.total).toBe(2)
    expect(data.items.length).toBe(2)
  })
})

