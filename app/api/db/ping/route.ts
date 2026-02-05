import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const started = Date.now();
  let ok = false;
  const info: any = {};
  let error: any = null;
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT current_database() as db, current_user as usr, now() as now, version() as version`
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const r = rows[0] as any;
      info.db = String(r.db || '');
      info.user = String(r.usr || '');
      info.now = String(r.now || '');
      info.version = String(r.version || '');
      ok = true;
    }
  } catch (e: any) {
    error = e?.message || String(e);
  }
  const elapsedMs = Date.now() - started;
  return NextResponse.json({ ok, elapsedMs, info, error }, { status: ok ? 200 : 503 });
}
