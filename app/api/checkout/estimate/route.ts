export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { env } from '@/env'
import { sharedRedis } from '@/lib/ratelimit'

type ShippingOption = { id: string; name: string; amount: number; currency: string; delivery_estimate: any };
const SHIPPING_CACHE_TTL = 5 * 60; // seconds
const fallbackShippingCache = new Map<string, { expiresAt: number; options: ShippingOption[] }>();
const SHIPPING_CACHE_PREFIX = 'shipping-rate:';

async function getCachedShippingOptions(cacheKey: string): Promise<ShippingOption[] | null> {
  if (sharedRedis) {
    try {
      const raw = (await sharedRedis.get(`${SHIPPING_CACHE_PREFIX}${cacheKey}`)) as { options?: unknown } | null;
      if (raw && Array.isArray((raw as any).options)) {
        return (raw as any).options as ShippingOption[];
      }
    } catch (error) {
      console.warn('Failed to read shipping cache from Redis', error);
    }
  } else {
    const cached = fallbackShippingCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.options;
    }
  }
  return null;
}

async function setCachedShippingOptions(cacheKey: string, options: ShippingOption[]): Promise<void> {
  if (sharedRedis) {
    try {
      await sharedRedis.set(`${SHIPPING_CACHE_PREFIX}${cacheKey}`, { options }, { ex: SHIPPING_CACHE_TTL });
      return;
    } catch (error) {
      console.warn('Failed to write shipping cache to Redis', error);
    }
  }
  fallbackShippingCache.set(cacheKey, { expiresAt: Date.now() + SHIPPING_CACHE_TTL * 1000, options });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { artworkId, address } = body || {}
    const requestedQuantity = Math.max(1, Math.min(10, Number(body?.quantity) || 1))
    if (!artworkId || !address || !address.country) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const stripeKey = env.STRIPE_SECRET_KEY
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null
    const artwork = await prisma.artwork.findUnique({ where: { id: artworkId }, include: { artist: true } })
    if (!artwork) return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
    const amountCents = Math.max(0, (artwork.price || 0) * 100 * requestedQuantity)
    const currency = 'eur'

    // Shipping options from env IDs
    const ids = stripeKey ? (env.STRIPE_SHIPPING_RATES || '').split(',').map((s: string)=>s.trim()).filter(Boolean) : []
    const shippingOptions: any[] = []
    if (stripe && ids.length) {
      const cacheKey = ids.join(',')
      const cached = await getCachedShippingOptions(cacheKey)
      if (cached) {
        shippingOptions.push(...cached)
      } else {
        const fresh: ShippingOption[] = []
        for (const id of ids) {
          try {
            const rate = await stripe.shippingRates.retrieve(id)
            const fixedRaw = (rate.fixed_amount as any)?.amount
            const fixed = typeof fixedRaw === 'number' ? fixedRaw : 0
            const rawCurrency = (rate.fixed_amount as any)?.currency
            const rcurrency = typeof rawCurrency === 'string' ? rawCurrency : 'eur'
            const name = rate.display_name ?? 'Shipping'
            fresh.push({ id: rate.id, name, amount: fixed, currency: rcurrency, delivery_estimate: rate.delivery_estimate || null })
          } catch (error) {
            console.warn('Failed to retrieve shipping rate', id, error)
          }
        }
        shippingOptions.push(...fresh)
        await setCachedShippingOptions(cacheKey, fresh)
      }
    }

    // Tax estimate (best-effort). If STRIPE_ENABLE_TAX=true, try Stripe Tax calculations API.
    let taxAmount = 0
    if (stripe && (env as any).STRIPE_ENABLE_TAX === 'true') {
      try {
        const calc = await stripe.tax.calculations.create({
          currency,
          line_items: [ { amount: amountCents, reference: 'artwork' } ],
          customer_details: {
            address: {
              country: address.country,
              postal_code: address.postal_code || undefined,
              state: address.state || undefined,
              city: address.city || undefined,
            }
          }
        })
        const inclusive = calc.tax_amount_inclusive ?? 0
        const exclusive = calc.tax_amount_exclusive ?? 0
        const fallback = (calc as any)?.tax_amount ?? 0
        taxAmount = inclusive || exclusive || fallback
      } catch {
        // ignore failure; return 0 (UI can display that actual tax will be computed at checkout)
        taxAmount = 0
      }
    }

    return NextResponse.json({
      subtotal: amountCents,
      currency,
      tax: taxAmount,
      shippingOptions,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to estimate' }, { status: 500 })
  }
}
