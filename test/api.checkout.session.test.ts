import { describe, it, expect, vi, beforeEach } from 'vitest'

// provider selection
vi.mock('@/lib/payments/provider', () => ({ getDefaultProvider: () => 'stripe' }))

// Mock underlying stripe create session util
vi.mock('@/lib/payments/stripe', () => ({
  createStripeCheckoutSession: vi.fn(async () => ({ id: 'cs_test_123', url: 'https://stripe.test/checkout' }))
}))

vi.mock('@/lib/ratelimit', () => ({ checkoutLimiter: undefined, getIpFromHeaders: (h:Headers) => 'test' }))
// Avoid loading real Prisma client
vi.mock('@/lib/prisma', () => ({ prisma: {} }))

// Import handler after mocks
async function getCheckoutPOST() {
  const mod = await import('../app/api/checkout/session/route')
  return mod.POST
}

function makeReq(body: any) {
  const headers = new Headers({ 'content-type': 'application/json' })
  return { headers, async json() { return body } } as any
}

describe('POST /api/checkout/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates body and returns 400 for missing artworkId', async () => {
    const checkoutPOST = await getCheckoutPOST()
    const res = await checkoutPOST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('creates a stripe session and returns 201 with id,url', async () => {
    const checkoutPOST = await getCheckoutPOST()
    const res = await checkoutPOST(makeReq({ artworkId: 'art_1' }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('cs_test_123')
    expect(data.url).toContain('stripe')
  })
})
