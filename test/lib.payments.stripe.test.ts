import { describe, it, expect, vi, beforeEach } from 'vitest'

// Build a fake Stripe SDK class
class FakeStripe {
  checkout = {
    sessions: {
      create: vi.fn(async () => ({ id: 'cs_123', url: 'https://example/checkout' }))
    }
  }
}

// Mock the 'stripe' module before importing the module under test
vi.mock('stripe', () => ({ default: FakeStripe }))

function getModule() {
  return import('@/lib/payments/stripe')
}

describe('lib/payments/stripe.createStripeCheckoutSession', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws if Stripe is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const mod = await getModule()
    await expect(mod.createStripeCheckoutSession({
      prisma: {} as any,
      artworkId: 'x',
      baseUrl: 'http://localhost:3000'
    } as any)).rejects.toThrow()
  })

  it('creates session with defaults and reserves artwork', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_PM_TYPES = ''
    const prisma = {
      artwork: {
        findUnique: vi.fn(async () => ({
          id: 'a1',
          title: 'T',
          price: 1000,
          artistId: 'ar1',
          imageUrl: '/img.jpg',
          isAvailable: true,
          status: 'available',
          artist: { stripeAccountId: null }
        })),
        updateMany: vi.fn(async () => ({ count: 1 }))
      },
      reservation: {
        create: vi.fn(async () => ({ id: 'res1' }))
      },
      $queryRaw: vi.fn(),
    } as any

    const mod = await getModule()
    const res = await mod.createStripeCheckoutSession({ prisma, artworkId: 'a1', baseUrl: 'http://localhost:3000' })
    expect(res.id).toBe('cs_123')
    expect(res.url).toBeTruthy()
  })
})
