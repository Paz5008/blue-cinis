import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getDefaultProvider } from "./provider";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { env } from "../../env";
import { logger } from "../../lib/logger";
import { getRequestId } from "../../lib/req";
import { CACHE_TAGS, CACHE_TAG_GROUPS } from "../cacheTags";

export async function handlePaymentsWebhook(
  req: NextRequest,
): Promise<NextResponse> {
  const rid = getRequestId(req.headers as any)
  const url = new URL(req.url);
  let defaultProvider: string;
  try {
    defaultProvider = getDefaultProvider();
  } catch (error) {
    logger.error({ rid, err: (error as any)?.message || error }, '[payments] unsupported default provider');
    return NextResponse.json(
      { error: 'Fournisseur de paiement indisponible, contactez le support.' },
      { status: 503 },
    );
  }
  const provider = (
    url.searchParams.get("provider") ||
    req.headers.get("x-payments-provider") ||
    defaultProvider
  ).toLowerCase();
  if (provider !== "stripe") {
    return NextResponse.json(
      { error: `Webhook provider non supporté: ${provider}` },
      { status: 501 },
    );
  }
  const stripeSecret = env.STRIPE_SECRET_KEY || "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET || "";
  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe non configuré" },
      { status: 500 },
    );
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig as string,
      webhookSecret,
    );
  } catch (err: any) {
    logger.error({ rid, err: err?.message || err, msg: 'stripe_webhook_invalid_sig' })
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Idempotence: insert-or-ignore with raw SQL to avoid type drift before prisma generate
  try {
    const evId = (event as any).id || null
    const evType = (event as any).type || 'unknown'
    const jsonPayload = payload || '{}'
    const inserted = await prisma.$executeRawUnsafe(
      'INSERT INTO "WebhookEvent" ("provider","type","payload","eventId") VALUES ($1,$2,$3::jsonb,$4) ON CONFLICT ("provider","eventId") DO NOTHING',
      'stripe', evType, jsonPayload, evId
    )
    if (!inserted) {
      logger.info({ rid, msg: 'webhook_duplicate_ignored', eventId: evId })
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }
  } catch { }

  try {
    const report = await processStripeWebhookEvent(event, { rid })
    return NextResponse.json({ received: true, handled: report.handled }, { status: 200 })
  } catch (error) {
    logger.error({ rid, err: (error as any)?.message || error, msg: 'webhook_process_failed' })
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 })
  }
}

type StripeWebhookProcessOptions = {
  rid?: string
}

export type StripeWebhookProcessReport = {
  handled: string[]
}

export async function processStripeWebhookEvent(
  event: Stripe.Event,
  options: StripeWebhookProcessOptions = {},
): Promise<StripeWebhookProcessReport> {
  const handled: string[] = []
  await handleCheckoutSessionCompleted(event, handled, options)
  await handleCheckoutExpiration(event, handled, options)
  await handleChargeRefunded(event, handled, options)
  await handleChargeDisputeCreated(event, handled, options)
  await handleChargeDisputeClosed(event, handled, options)

  if (handled.length) {
    logger.info({ rid: options.rid, msg: 'webhook_processed', handled, type: event.type })
  } else {
    logger.info({ rid: options.rid, msg: 'webhook_unhandled', type: event.type })
  }

  return { handled }
}

async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
  handled: string[],
  options: StripeWebhookProcessOptions,
) {
  if (event.type !== 'checkout.session.completed') return
  const rid = options.rid
  const session = event.data.object as Stripe.Checkout.Session
  const md = (session.metadata || {}) as Record<string, string>
  const artworkId = md.artworkId
  const artistId = md.artistId
  const amountMeta = md.amount ? parseInt(md.amount, 10) : undefined
  const amount = Number.isFinite(amountMeta as any) ? (amountMeta as number) : session.amount_total ?? 0
  const currency = (session.currency || md.currency || 'eur').toLowerCase()
  const buyerEmail = session.customer_details?.email || (session.customer_email as string | null) || null
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as any)?.id || null
  const stripeSessionId = session.id

  const fee = Math.round((amount || 0) * 0.07)
  const net = Math.max(0, (amount || 0) - fee)
  const tax = (session.total_details as any)?.amount_tax ?? 0
  const shipping = (session.shipping_cost as any)?.amount_total ?? 0
  const buyerName = session.customer_details?.name || null
  const buyerPhone = (session.customer_details as any)?.phone || null
  const billingAddress = (session.customer_details as any)?.address || null
  const shippingAddress = (session.shipping_details as any)?.address || null

  const existing = await prisma.order.findUnique({ where: { stripeSessionId } })
  const alreadyProcessed = !!existing && existing.status === 'paid'

  let criticalOk = true
  if (!alreadyProcessed) {
    try {
      await prisma.$transaction(async (tx) => {
        if (artworkId) {
          let vId: string | null = null
          try {
            const r = await tx.reservation.update({ where: { stripeSessionId }, data: { status: 'consumed' } })
            vId = (r as any)?.variantId || null
          } catch { }
          if (vId) {
            const v = await tx.variant.findUnique({ where: { id: vId }, select: { stockQuantity: true } })
            if (v) {
              const newStock = typeof v.stockQuantity === 'number' ? Math.max(0, v.stockQuantity - 1) : 0
              await tx.variant.update({ where: { id: vId }, data: { stockQuantity: newStock } })
              const vs = await tx.variant.findMany({ where: { artworkId }, select: { stockQuantity: true } })
              const sum = vs.reduce((acc, cur) => acc + (typeof cur.stockQuantity === 'number' ? cur.stockQuantity : 0), 0)
              const isAvail = sum > 0
              await tx.artwork.update({ where: { id: artworkId }, data: { status: isAvail ? 'available' : 'sold', reservedUntil: null } })
            }
          } else {
            const art = await tx.artwork.findUnique({ where: { id: artworkId }, select: { stockQuantity: true } })
            if (art) {
              const newStock = typeof art.stockQuantity === 'number' ? Math.max(0, art.stockQuantity - 1) : 0
              await tx.artwork.update({
                where: { id: artworkId },
                data: { stockQuantity: newStock, status: newStock > 0 ? 'available' : 'sold', reservedUntil: null },
              })
            } else {
              await tx.artwork.update({ where: { id: artworkId }, data: { status: 'sold', reservedUntil: null } })
            }
          }
        }
        await tx.order.upsert({
          where: { stripeSessionId },
          update: {
            status: 'paid',
            buyerEmail: buyerEmail || undefined,
            buyerName: buyerName || undefined,
            buyerPhone: buyerPhone || undefined,
            paymentIntentId: paymentIntentId || undefined,
            amount: amount || 0,
            currency,
            fee,
            net,
            tax,
            shipping,
            billingAddress: billingAddress ? (billingAddress as any) : undefined,
            shippingAddress: shippingAddress ? (shippingAddress as any) : undefined,
          },
          create: {
            artworkId: artworkId || 'unknown',
            artistId: artistId || 'unknown',
            buyerEmail: buyerEmail || undefined,
            buyerName: buyerName || undefined,
            buyerPhone: buyerPhone || undefined,
            amount: amount || 0,
            currency,
            fee,
            net,
            tax,
            shipping,
            stripeSessionId,
            paymentIntentId: paymentIntentId || undefined,
            status: 'paid',
            fulfillmentStatus: 'pending_shipment',
            billingAddress: billingAddress ? (billingAddress as any) : undefined,
            shippingAddress: shippingAddress ? (shippingAddress as any) : undefined,
          },
        })
      })
      handled.push('orders.inventory_updated')
    } catch (e) {
      logger.error({ rid, err: (e as any)?.message || e, msg: 'order_tx_failed', stripeSessionId, artworkId })
      criticalOk = false
    }
  }

  handled.push('orders.upserted')

  try {
    const { mailer } = await import('../../lib/mailer')
    const adminEmail = env.SALES_EMAIL || env.SMTP_USER || ''
    let artworkTitle: string | undefined
    let artistEmail: string | undefined
    if (artworkId) {
      try {
        const art = await prisma.artwork.findUnique({
          where: { id: artworkId },
          include: { artist: { include: { user: true } } },
        })
        artworkTitle = art?.title || undefined
        artistEmail = art?.artist?.user?.email || undefined
      } catch { }
    }

    const { renderOrderNotificationEmail } = await import('../../lib/emailRenderer')
    const baseParams = {
      artworkTitle,
      amount: amount || 0,
      fee,
      currency,
      stripeSessionId,
      paymentIntentId,
    }

    if (buyerEmail) {
      const { subject, html } = await renderOrderNotificationEmail('buyer', baseParams)
      await mailer.send({ to: buyerEmail, subject, html })
    }
    if (artistEmail) {
      const { subject, html } = await renderOrderNotificationEmail('artist', baseParams)
      await mailer.send({ to: artistEmail, subject, html })
    }
    if (adminEmail) {
      const { subject, html } = await renderOrderNotificationEmail('admin', baseParams)
      await mailer.send({ to: adminEmail, subject, html })
    }
    handled.push('notifications.sent')
  } catch (e) {
    logger.error({ rid, err: (e as any)?.message || e, msg: 'order_emails_failed', stripeSessionId })
  }

  if (!criticalOk) {
    throw new Error('order_persist_failed')
  }

  if (!alreadyProcessed && criticalOk) {
    try {
      const tags = new Set([
        CACHE_TAGS.featuredArtworks,
        ...CACHE_TAG_GROUPS.artists.tags,
      ])
      tags.forEach((tag) => revalidateTag(tag))
      handled.push('cache.revalidated')
    } catch (error) {
      logger.warn({ rid, err: (error as any)?.message || error, msg: 'cache_revalidate_failed_after_order' })
    }
  }
}

async function handleCheckoutExpiration(
  event: Stripe.Event,
  handled: string[],
  options: StripeWebhookProcessOptions,
) {
  if (event.type !== 'checkout.session.expired' && event.type !== 'checkout.session.async_payment_failed') {
    return
  }
  const rid = options.rid
  try {
    const session = event.data.object as Stripe.Checkout.Session
    const md = (session.metadata || {}) as Record<string, string>
    const artworkId = md.artworkId
    const stripeSessionId = session.id
    try {
      await prisma.reservation.update({ where: { stripeSessionId }, data: { status: 'expired' } })
    } catch { }
    if (artworkId) {
      await prisma.artwork.updateMany({
        where: { id: artworkId },
        data: { reservedUntil: null },
      })
    }
    handled.push('reservation.released')
  } catch (e) {
    logger.error({ rid, err: (e as any)?.message || e, msg: 'reservation_release_failed' })
  }
}

async function handleChargeRefunded(event: Stripe.Event, handled: string[], options: StripeWebhookProcessOptions) {
  if (event.type !== 'charge.refunded') return
  const rid = options.rid
  try {
    const charge = event.data.object as Stripe.Charge
    const paymentIntentId =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : (charge.payment_intent as any)?.id
    if (paymentIntentId) {
      await prisma.order.updateMany({
        where: { paymentIntentId },
        data: { status: 'refunded' },
      })
      handled.push('orders.refunded')
    }
  } catch (e) {
    logger.error({ rid, err: (e as any)?.message || e, msg: 'order_refund_update_failed' })
  }
}

async function handleChargeDisputeCreated(
  event: Stripe.Event,
  handled: string[],
  options: StripeWebhookProcessOptions,
) {
  if (event.type !== 'charge.dispute.created') return
  const rid = options.rid
  try {
    const dispute = event.data.object as Stripe.Dispute
    const paymentIntentId =
      typeof dispute.payment_intent === 'string' ? dispute.payment_intent : (dispute.payment_intent as any)?.id
    if (paymentIntentId) {
      await prisma.order.updateMany({
        where: { paymentIntentId },
        data: { status: 'disputed' },
      })
      handled.push('orders.disputed')
    }
  } catch (e) {
    logger.error({ rid, err: (e as any)?.message || e, msg: 'order_dispute_update_failed' })
  }
}

async function handleChargeDisputeClosed(
  event: Stripe.Event,
  handled: string[],
  options: StripeWebhookProcessOptions,
) {
  if (event.type !== 'charge.dispute.closed') return
  const rid = options.rid
  try {
    const dispute = event.data.object as Stripe.Dispute
    const paymentIntentId =
      typeof dispute.payment_intent === 'string' ? dispute.payment_intent : (dispute.payment_intent as any)?.id
    if (paymentIntentId) {
      await prisma.order.updateMany({
        where: { paymentIntentId, status: { not: 'refunded' } },
        data: { status: 'paid' },
      })
      handled.push('orders.dispute_closed')
    }
  } catch (e) {
    logger.error({ rid, err: (e as any)?.message || e, msg: 'order_dispute_closed_update_failed' })
  }
}
