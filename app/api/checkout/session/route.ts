import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkoutLimiter, getIpFromHeaders } from '@/lib/ratelimit';
import { z } from 'zod';
import { getDefaultProvider } from '@/lib/payments/provider';
import { createStripeCheckoutSession } from '@/lib/payments/stripe';
import { env } from '@/env';
import { paymentsLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    if (checkoutLimiter) {
      const ip = getIpFromHeaders(req.headers);
      const rl = await checkoutLimiter.limit(`checkout:${ip}`);
      if (!rl.success) {
        return NextResponse.json({ error: 'Trop de tentatives, réessayez plus tard.' }, { status: 429, headers: { 'Retry-After': '60' } });
      }
    }

    const body = await req.json();
    const schema = z.object({
      artworkId: z.string().min(1),
      variantId: z.string().optional(),
      quantity: z.coerce.number().int().min(1).max(10).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'artworkId invalide' }, { status: 400 });
    }
    const { artworkId, variantId, quantity } = parsed.data;
    const requestedQuantity = quantity ?? 1;
    const baseUrl = env.NEXT_PUBLIC_BASE_URL || env.DOMAIN || env.NEXTAUTH_URL || 'http://localhost:3000';
    let provider: ReturnType<typeof getDefaultProvider>;
    try {
      provider = getDefaultProvider();
    } catch (error) {
      paymentsLogger.error({ err: error }, 'Invalid payments provider configuration');
      return NextResponse.json(
        { error: 'Fournisseur de paiement indisponible, contactez le support.' },
        { status: 503 },
      );
    }
    if (provider === 'stripe') {
      const result = await createStripeCheckoutSession({
        prisma,
        artworkId,
        variantId,
        baseUrl,
        quantity: requestedQuantity,
        enableTax: (env as any).STRIPE_ENABLE_TAX === 'true',
      });
      return NextResponse.json({ id: result.id, url: result.url }, { status: 201 });
    }
    /**
     * ROADMAP: Additional payment providers
     * - PayPal: Use @paypal/checkout-server-sdk with createOrder/captureOrder pattern
     * - Adyen: Use @adyen/api-library for server-side integration
     * - Mollie: Use @mollie/api-client for EU payments
     * All providers should implement the same interface for easy switching.
     */
    return NextResponse.json({ error: `Fournisseur de paiement non pris en charge: ${provider}` }, { status: 501 });
  } catch (e) {
    paymentsLogger.error({ err: e }, 'Error creating checkout session');
    return NextResponse.json({ error: 'Erreur lors de la création de la session' }, { status: 500 });
  }
}
