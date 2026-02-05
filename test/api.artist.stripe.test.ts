import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    artist: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

class FakeStripe {
  accounts = {
    retrieve: vi.fn(async () => ({ id: 'acct_1', country: 'FR', business_type: 'individual', email: 'a@b', details_submitted: true, charges_enabled: true, payouts_enabled: true, capabilities: {}, requirements: {} })),
    create: vi.fn(async () => ({ id: 'acct_1' })),
    createLoginLink: vi.fn(async () => ({ url: 'https://stripe.test/login' })),
  }
  accountLinks = { create: vi.fn(async () => ({ url: 'https://stripe.test/onboard' })) }
  constructor(_: string, __: any) {}
}
vi.mock('stripe', () => ({ default: class extends FakeStripe {} }))

async function mStatus() { return await import('../app/api/artist/stripe/status/route') }
async function mLogin()  { return await import('../app/api/artist/stripe/login-link/route') }
async function mAccount(){ return await import('../app/api/artist/stripe/account-link/route') }

const makeReq = () => ({ url: 'http://localhost', headers: new Headers() }) as any

describe('Artist Stripe endpoints', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => { delete process.env.STRIPE_SECRET_KEY; delete process.env.NEXTAUTH_URL; delete process.env.DOMAIN })

  it('status: 401 if not artist', async () => {
    const { GET } = await mStatus()
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('status: connected false if no account id', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1', stripeAccountId: null })
    const { GET } = await mStatus()
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.connected).toBe(false)
  })

  it('status: api unavailable but account connected when missing secret', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1', stripeAccountId: 'acct_1' })
    const { GET } = await mStatus()
    const res = await GET(makeReq())
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.connected).toBe(true)
    expect(data.stripeApiAvailable).toBe(false)
  })

  it('login-link: 500 when missing secret; 400 when no account id; 200 success', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    const { POST } = await mLogin()

    // Missing secret
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1', stripeAccountId: 'acct_1' })
    let res = await POST(makeReq())
    expect(res.status).toBe(500)

    // No account id
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1', stripeAccountId: null })
    res = await POST(makeReq())
    expect(res.status).toBe(400)

    // Success
    const { POST: POST2 } = await mLogin()
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1', stripeAccountId: 'acct_1' })
    res = await POST2(makeReq())
    expect(res.status).toBe(200)
  })

  it('account-link: creates account if needed and returns 201', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    const { POST } = await mAccount()
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1', user: { email: 'a@b' }, stripeAccountId: null })
    prisma.artist.update.mockResolvedValueOnce({ id: 'ar1', stripeAccountId: 'acct_1' })
    const res = await POST(makeReq())
    expect(res.status).toBe(201)
  })
})
