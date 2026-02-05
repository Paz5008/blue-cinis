import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
const prismaMocks: any = {
  $transaction: vi.fn(async (cb: any) => await cb(prismaMocks)),
  reservation: { update: vi.fn(async () => ({ variantId: null })) },
  variant: { findUnique: vi.fn(async () => null), findMany: vi.fn(async () => []), update: vi.fn(async () => ({})) },
  artwork: { findUnique: vi.fn(async () => ({ stockQuantity: 0 })), update: vi.fn(async () => ({})), updateMany: vi.fn(async () => ({ count: 1 })) },
  order: { findUnique: vi.fn(async () => null), upsert: vi.fn(async () => ({})), updateMany: vi.fn(async () => ({ count: 1 })) },
}
vi.mock('../src/lib/prisma', () => ({ prisma: prismaMocks }))

// Fake Stripe SDK to bypass signature verification and return our event
class FakeStripe {
  constructor(_: string, __: any) {}
  webhooks = {
    constructEvent: (payload: string) => {
      const parsed = JSON.parse(payload)
      return parsed
    }
  }
}
vi.mock('stripe', () => ({ default: FakeStripe }))

function makeReq(event: any, headers?: Record<string,string>) {
  const body = JSON.stringify(event)
  return {
    url: 'http://localhost/api/payments/webhook?provider=stripe',
    headers: { get: (k: string) => headers?.[k.toLowerCase()] ?? null },
    async text() { return body },
  } as any
}

async function getHandler() {
  const mod = await import('../src/lib/payments/webhooks')
  return mod.handlePaymentsWebhook
}

describe('payments webhook (stripe)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'
  })

  it('processes checkout.session.completed and persists order', async () => {
    const handle = await getHandler()
    const evt = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          amount_total: 1000,
          currency: 'eur',
          metadata: { artworkId: 'a1', artistId: 'ar1', amount: '1000' },
          customer_details: { email: 'buyer@example.com' },
          payment_intent: 'pi_123',
        }
      }
    }
    const res = await handle(makeReq(evt))
    expect(res.status).toBe(200)
    expect(prismaMocks.order.upsert).toHaveBeenCalled()
  })

  it('returns 500 if order upsert fails (critical)', async () => {
    const handle = await getHandler()
    prismaMocks.order.upsert.mockRejectedValueOnce(new Error('db down'))
    const evt = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          amount_total: 1000,
          currency: 'eur',
          metadata: { artworkId: 'a1', artistId: 'ar1', amount: '1000' },
          customer_details: { email: 'buyer@example.com' },
          payment_intent: 'pi_123',
        }
      }
    }
    const res = await handle(makeReq(evt))
    expect(res.status).toBe(500)
  })

  it('ignores duplicate event id (idempotence)', async () => {
    const handle = await getHandler()
    const evt = {
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123', amount_total: 1000, currency: 'eur', metadata: { artworkId: 'a1', artistId: 'ar1', amount: '1000' }, customer_details: { email: 'buyer@example.com' }, payment_intent: 'pi_123' } }
    }
    let res = await handle(makeReq(evt))
    expect(res.status).toBe(200)
    const { prisma } = await import('../src/lib/prisma') as any
    prisma.webhookEvent = prisma.webhookEvent || {}
    prisma.webhookEvent.findFirst = vi.fn(async () => ({ id: 'wh1' }))
    res = await handle(makeReq(evt))
    expect(res.status).toBe(200)
})
})
