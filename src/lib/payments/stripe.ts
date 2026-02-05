import Stripe from 'stripe';
import type { PrismaClient } from '@prisma/client';
import { env } from '../../env';

const stripeSecret = env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : (null as unknown as Stripe);

export async function createStripeCheckoutSession(params: {
  prisma: PrismaClient;
  artworkId: string;
  variantId?: string;
  baseUrl: string;
  enableTax?: boolean;
  quantity?: number;
}): Promise<{ url: string; id: string }> {
  if (!stripeSecret || !stripe) {
    throw new Error('Stripe non configuré');
  }

  const { prisma, artworkId, variantId, baseUrl, enableTax, quantity } = params;
  const requestedQuantity = Math.max(1, Math.min(10, quantity ?? 1));
  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId }, include: { artist: true, reservations: { where: { status: 'active', expiresAt: { gt: new Date() } } }, variants: true } });
  if (!artwork) throw new Error('Œuvre introuvable');
  if (artwork.status !== 'available') throw new Error('Œuvre indisponible');

  let productName = artwork.title
  let unitAmountCents = Math.max(0, (artwork.price || 0) * 100)
  if (variantId) {
    const variant = artwork.variants.find(v => v.id === variantId)
    if (!variant) throw new Error('Variante introuvable')
    const vStock = typeof variant.stockQuantity === 'number' ? variant.stockQuantity : 1
    const reservedVariantAgg = await prisma.reservation.aggregate({
      _sum: { quantity: true },
      where: { artworkId, variantId, status: 'active', expiresAt: { gt: new Date() } },
    })
    const reservedVariant = reservedVariantAgg._sum.quantity ?? 0
    if (vStock - reservedVariant < requestedQuantity) throw new Error('Plus de stock disponible pour cette variante')
    if (typeof variant.priceOverride === 'number') unitAmountCents = Math.max(0, variant.priceOverride * 100)
    productName = `${artwork.title} – ${variant.name}`
  } else {
    const stock = typeof artwork.stockQuantity === 'number' ? artwork.stockQuantity : 1
    const reservedActive = ((artwork as any).reservations || []).reduce((sum: number, entry: any) => {
      return sum + Math.max(1, Number(entry?.quantity) || 1)
    }, 0)
    if (stock - reservedActive < requestedQuantity) {
      throw new Error('Plus de stock disponible');
    }
  }
  const totalAmountCents = unitAmountCents * requestedQuantity

  // Réservation 15 minutes pour éviter double-vente (alignée avec le front)
  const ttlSource =
    (env as any).RESERVATION_TTL_MIN ??
    process.env.NEXT_PUBLIC_RESERVATION_TTL_MIN ??
    '15'
  const ttlMin = parseInt(ttlSource, 10)
  const now = new Date();

  const imageAbs = artwork.imageUrl?.startsWith('http')
    ? artwork.imageUrl
    : new URL(artwork.imageUrl || '', baseUrl).toString();

  const feeCents = Math.round(totalAmountCents * 0.07);
  const hasConnect = !!artwork.artist?.stripeAccountId;

  // Méthodes de paiement configurables via STRIPE_PM_TYPES (ex: "card,sepa_debit,ideal")
  const pmEnv = (env.STRIPE_PM_TYPES || '').trim();
  const pmTypes = pmEnv
    ? pmEnv.split(',').map((s: string) => s.trim()).filter(Boolean)
    : ['card'];

  // Shipping options (pre-configured Shipping Rate IDs in Stripe Dashboard)
  const shippingRatesEnv = (env.STRIPE_SHIPPING_RATES || '').trim()
  const shippingRates = shippingRatesEnv ? shippingRatesEnv.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  const countriesEnv = (env.STRIPE_SHIPPING_COUNTRIES || '').trim()
  const allowedCountries = countriesEnv ? countriesEnv.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean) : ['FR', 'BE', 'DE', 'ES', 'IT', 'NL', 'LU', 'CH', 'GB']


  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: 'eur',
    // Méthodes de paiement (Apple/Google Pay activés automatiquement pour 'card' si le domaine est vérifié)
    payment_method_types: pmTypes as any,
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    shipping_address_collection: { allowed_countries: allowedCountries as any },
    shipping_options: shippingRates.length ? shippingRates.map((id: string) => ({ shipping_rate: id })) : undefined,
    automatic_tax: { enabled: !!enableTax },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cancel`,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: productName, images: imageAbs ? [imageAbs] : undefined },
          unit_amount: unitAmountCents,
        },
        quantity: requestedQuantity,
      },
    ],
    metadata: {
      artworkId: artwork.id,
      variantId: variantId || '',
      artistId: artwork.artistId,
      amount: String(totalAmountCents),
      quantity: String(requestedQuantity),
      unitAmount: String(unitAmountCents),
      currency: 'eur',
      artworkTitle: productName || '',
    },
    payment_intent_data: hasConnect
      ? {
        application_fee_amount: feeCents,
        transfer_data: { destination: artwork.artist!.stripeAccountId as string },
        on_behalf_of: artwork.artist!.stripeAccountId as string,
      }
      : undefined,
  });

  // We must create the reservation BEFORE returning the session.
  // If this fails, we should not let the user pay.
  await prisma.reservation.create({
    data: {
      artworkId,
      variantId: variantId || null,
      quantity: requestedQuantity,
      stripeSessionId: session.id,
      status: 'active',
      expiresAt: new Date(now.getTime() + ttlMin * 60 * 1000),
    }
  });

  return { id: session.id, url: session.url! };
}
