import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { ensureAdminSession } from '@/lib/adminGuard';
import { recordAdminAuditLog } from '@/lib/audit';
import { validateMfaToken, describeMfaFailure } from '@/lib/mfa';
import { z } from 'zod';

const refundSchema = z.object({
  reason: z.string().min(10, 'Le motif doit contenir au moins 10 caractères.').max(500),
});

const REFUNDABLE_STATUSES = new Set(['paid', 'disputed']);
const isMfaDisabled = () => process.env.ADMIN_MFA_BYPASS === '1' || process.env.NODE_ENV === 'test';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
  const session = await ensureAdminSession();
  if (!session) {
    await recordAdminAuditLog({
      action: 'orders.refund',
      resource: orderId,
      request: req,
      status: 'denied',
      metadata: { reason: 'unauthorized' },
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let reason: string;
  try {
    const json = await req.json();
    const parsed = refundSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error('invalid_payload');
    }
    reason = parsed.data.reason;
  } catch {
    await recordAdminAuditLog({
      action: 'orders.refund',
      resource: orderId,
      request: req,
      session,
      status: 'denied',
      metadata: { reason: 'invalid_payload' },
    });
    return NextResponse.json({ error: 'Motif requis pour le remboursement' }, { status: 400 });
  }

  try {

    if (!orderId) {
      await recordAdminAuditLog({
        action: 'orders.refund',
        resource: orderId,
        request: req,
        session,
        status: 'denied',
        metadata: { reason: 'missing_order_id' },
      });
      return NextResponse.json({ error: 'Order id requis' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentIntentId: true, status: true },
    });
    if (!order) {
      await recordAdminAuditLog({
        action: 'orders.refund',
        resource: orderId,
        request: req,
        session,
        status: 'denied',
        metadata: { reason: 'not_found' },
      });
      return NextResponse.json({ error: 'Order introuvable' }, { status: 404 });
    }
    if (!order.paymentIntentId) {
      await recordAdminAuditLog({
        action: 'orders.refund',
        resource: orderId,
        request: req,
        session,
        status: 'denied',
        metadata: { reason: 'missing_payment_intent' },
      });
      return NextResponse.json({ error: 'PaymentIntent manquant' }, { status: 400 });
    }
    if (order.status === 'refunded') {
      await recordAdminAuditLog({
        action: 'orders.refund',
        resource: orderId,
        request: req,
        session,
        status: 'denied',
        metadata: { reason: 'already_refunded' },
      });
      return NextResponse.json({ error: 'Commande déjà remboursée' }, { status: 400 });
    }
    if (!REFUNDABLE_STATUSES.has(order.status)) {
      await recordAdminAuditLog({
        action: 'orders.refund',
        resource: orderId,
        request: req,
        session,
        status: 'denied',
        metadata: { reason: 'invalid_status', status: order.status },
      });
      return NextResponse.json({ error: 'Statut non remboursable' }, { status: 400 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
    if (!stripeSecret) {
      await recordAdminAuditLog({
        action: 'orders.refund',
        resource: orderId,
        request: req,
        session,
        status: 'error',
        metadata: { reason: 'stripe_unconfigured' },
      });
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
    }
    if (!isMfaDisabled()) {
      const mfaCheck = await validateMfaToken({
        token: req.headers.get('x-admin-mfa-token'),
        userId: session.user?.id || null,
        scope: 'orders.refund',
      });
      if (!mfaCheck.ok) {
        await recordAdminAuditLog({
          action: 'orders.refund',
          resource: orderId,
          request: req,
          session,
          status: 'denied',
          metadata: { reason: 'mfa_failed', detail: mfaCheck.reason },
        });
        return NextResponse.json({ error: describeMfaFailure(mfaCheck.reason) }, { status: 412 });
      }
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    try {
      const pi = await stripe.paymentIntents.retrieve(order.paymentIntentId);
      const amountReceived = (pi as any).amount_received || 0;
      const clist = await stripe.charges.list({ payment_intent: order.paymentIntentId, limit: 100 });
      const amountRefunded = clist.data.reduce((sum: number, c: any) => sum + (c.amount_refunded || 0), 0);
      if (amountReceived > 0 && amountRefunded >= amountReceived) {
        await recordAdminAuditLog({
          action: 'orders.refund',
          resource: orderId,
          request: req,
          session,
          status: 'denied',
          metadata: { reason: 'already_refunded_stripe' },
        });
        return NextResponse.json({ error: 'Payment already fully refunded' }, { status: 400 });
      }
    } catch {
      // continue if retrieval failed; Stripe will validate on refund call
    }

    await stripe.refunds.create({ payment_intent: order.paymentIntentId });
    await prisma.order.update({ where: { id: order.id }, data: { status: 'refunded' } });

    await recordAdminAuditLog({
      action: 'orders.refund',
      resource: order.id,
      session,
      request: req,
      metadata: { reason },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('Erreur POST /api/orders/[id]/refund', e);
    await recordAdminAuditLog({
      action: 'orders.refund',
      resource: orderId,
      session,
      request: req,
      status: 'error',
    });
    return NextResponse.json({ error: 'Erreur lors du remboursement' }, { status: 500 });
  }
}
