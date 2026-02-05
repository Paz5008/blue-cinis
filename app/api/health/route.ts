import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';
import { env } from '@/env';
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/req'
import { listRuntimeAlerts } from '@/lib/runtimeAlerts'

function pushIfMissing(arr: string[], cond: boolean, msg: string) {
  if (cond) arr.push(msg);
}

export async function GET(_req: NextRequest) {
  const rid = getRequestId(_req.headers as any)
  const issues: string[] = [];
  const warnings: string[] = [];
  const nodeEnv = env.NODE_ENV || 'development';
  const hasStripeKey = !!env.STRIPE_SECRET_KEY;
  const hasStripeWebhook = !!env.STRIPE_WEBHOOK_SECRET;
  const hasDomain = !!env.DOMAIN || !!env.NEXTAUTH_URL;
  const hasSmtp = !!env.SMTP_HOST && !!env.SMTP_PORT && !!env.SMTP_USER && !!env.SMTP_PASS;

  // In development, treat optional integrations as warnings to avoid noisy failures
  if (nodeEnv === 'production') {
    pushIfMissing(issues, !hasStripeKey, 'Missing STRIPE_SECRET_KEY');
    pushIfMissing(issues, !hasStripeWebhook, 'Missing STRIPE_WEBHOOK_SECRET');
    pushIfMissing(issues, !hasDomain, 'Missing DOMAIN in production (or NEXTAUTH_URL)');
    pushIfMissing(issues, !hasSmtp, 'Missing SMTP configuration');
  } else {
    pushIfMissing(warnings, !hasStripeKey, 'Missing STRIPE_SECRET_KEY');
    pushIfMissing(warnings, !hasStripeWebhook, 'Missing STRIPE_WEBHOOK_SECRET');
    pushIfMissing(warnings, !hasSmtp, 'Missing SMTP configuration');
  }

  let dbOk = false;
  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    issues.push('Database connectivity failed');
  }

  if (dbOk) {
    try {
      // Check columns existence via information_schema
      const artistCols = await prisma.$queryRaw<Array<{ column_name: string }>>`SELECT column_name FROM information_schema.columns WHERE table_name = 'Artist'`;
      const artworkCols = await prisma.$queryRaw<Array<{ column_name: string }>>`SELECT column_name FROM information_schema.columns WHERE table_name = 'Artwork'`;
      const hasStripeAccountCol = artistCols.some(c => c.column_name === 'stripeAccountId');
      const hasReservedUntilCol = artworkCols.some(c => c.column_name === 'reservedUntil');
      pushIfMissing(issues, !hasStripeAccountCol, 'DB column Artist.stripeAccountId missing');
      pushIfMissing(issues, !hasReservedUntilCol, 'DB column Artwork.reservedUntil missing');
    } catch {
      issues.push('Failed to inspect information_schema');
    }
  } else {
    warnings.push('Skipped schema checks due to DB connectivity failure');
  }

  if (dbOk) {
    try {
      // Check Order table availability
      await prisma.$queryRaw`SELECT 1 FROM "Order" LIMIT 1`;
    } catch {
      issues.push('Order table missing or not accessible');
    }
  }

  const runtimeAlerts = listRuntimeAlerts()
  for (const alert of runtimeAlerts) {
    const msg = `[runtime:${alert.key}] ${alert.reason} (occurrences=${alert.occurrences})`
    if (alert.severity === 'critical') {
      issues.push(msg)
    } else {
      warnings.push(msg)
    }
  }

  const ok = issues.length === 0;
  if (!ok) {
    try {
      Sentry.captureMessage('Health check issues', { level: 'error', extra: { issues } });
    } catch {}
  }
  logger.info({ rid, path: '/api/health', ok, issues, warnings })
  return NextResponse.json({ ok, issues, warnings, alerts: runtimeAlerts, env: nodeEnv, timestamp: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
