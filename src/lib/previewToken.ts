import crypto from 'crypto';

export type PreviewClaims = {
  sub: string; // userId
  key: string; // page key, e.g. 'profile'
  exp: number; // seconds since epoch
};

function base64url(input: Buffer | string) {
  return (typeof input === 'string' ? Buffer.from(input) : input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getSecret(): string {
  const s = process.env.PREVIEW_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) {
    // Dev fallback to reduce friction
    return 'dev-preview-secret-change-me';
  }
  return s;
}

export function signPreviewToken(userId: string, key: string, ttlSeconds = 15 * 60): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds);
  const payload: PreviewClaims = { sub: userId, key: (key || 'profile').toLowerCase(), exp };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest();
  return `${data}.${base64url(sig)}`;
}

export function verifyPreviewToken(token: string): PreviewClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const data = `${h}.${p}`;
    const expected = base64url(crypto.createHmac('sha256', getSecret()).update(data).digest());
    if (s !== expected) return null;
    const payload = JSON.parse(
      Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as PreviewClaims;
    if (!payload || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
