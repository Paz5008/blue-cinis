import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = process.env.PAYPAL_CLIENT_ID || '';
    const secret = process.env.PAYPAL_CLIENT_SECRET || '';
    const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
    const configured = !!client && !!secret;
    return NextResponse.json({ configured, env: configured ? (env === 'live' ? 'live' : 'sandbox') : 'unknown' });
  } catch {
    return NextResponse.json({ error: 'Erreur statut PayPal' }, { status: 500 });
  }
}
