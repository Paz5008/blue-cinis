import type { PrismaClient } from '@prisma/client';

function getPaypalBase() {
  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET || '';
  if (!client || !secret) throw new Error('PayPal non configuré (client/secret)');
  const base = getPaypalBase();
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token error: ${res.status}`);
  const data: any = await res.json();
  return data.access_token as string;
}

export async function createPaypalOrder(params: { prisma: PrismaClient; artworkId: string; baseUrl: string; quantity?: number }) {
  const { prisma, artworkId, baseUrl, quantity } = params;
  const requestedQuantity = Math.max(1, Math.min(10, quantity ?? 1));
  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId }, include: { artist: true } });
  if (!artwork) throw new Error('Œuvre introuvable');
  if (artwork.status !== 'available') throw new Error('Œuvre indisponible');

  const now = new Date();
  // On atomic update reservedUntil if status is available
  const updated = await prisma.artwork.updateMany({ where: { id: artworkId, status: 'available', OR: [{ reservedUntil: null }, { reservedUntil: { lt: now } }] }, data: { reservedUntil: new Date(now.getTime() + 15 * 60 * 1000) } });
  if (updated.count === 0) throw new Error('Œuvre en cours de réservation, réessayez plus tard.');

  const value = Number((artwork.price || 0) * requestedQuantity).toFixed(2);
  const token = await getAccessToken();
  const base = getPaypalBase();
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'EUR', value },
          custom_id: JSON.stringify({ artworkId: artwork.id, artistId: artwork.artistId }),
        },
      ],
      application_context: {
        return_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/cancel`,
      },
    }),
  });
  if (!res.ok) throw new Error(`Erreur création de commande PayPal: ${res.status}`);
  const data: any = await res.json();
  const approve = (data.links || []).find((l: any) => l.rel === 'approve');
  if (!approve?.href) throw new Error('Lien d’approbation PayPal introuvable');
  return { id: data.id as string, url: approve.href as string };
}

export async function capturePaypalOrder(prisma: PrismaClient, orderId: string) {
  const token = await getAccessToken();
  const base = getPaypalBase();
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur capture PayPal: ${res.status}`);
  const data: any = await res.json();
  const pu = (data.purchase_units || [])[0] || {};
  const custom = pu.custom_id ? JSON.parse(pu.custom_id) : {};
  const amountObj = pu.payments?.captures?.[0]?.amount || pu.amount || { value: '0.00', currency_code: 'EUR' };
  const amount = Math.round(parseFloat(amountObj.value || '0') * 100);
  const currency = (amountObj.currency_code || 'EUR').toLowerCase();
  const artworkId = custom.artworkId as string | undefined;
  const artistId = custom.artistId as string | undefined;

  try {
    if (artworkId) {
      await prisma.artwork.update({ where: { id: artworkId }, data: { status: 'sold', reservedUntil: null } });
    }
  } catch { }

  const fee = Math.round((amount || 0) * 0.07);
  const net = Math.max(0, (amount || 0) - fee);
  await prisma.order.create({
    data: {
      artworkId: artworkId || 'unknown',
      artistId: artistId || 'unknown',
      buyerEmail: undefined,
      amount: amount || 0,
      currency,
      fee,
      net,
      stripeSessionId: `paypal_${orderId}`,
      paymentIntentId: undefined,
      status: 'paid',
    },
  });

  return { amount, currency };
}
