import { createHmac, timingSafeEqual } from "crypto";

type BannerCtaPayload = {
  artistId: string;
  ctaHref: string;
  placement?: string | null;
  issuedAt?: number;
};

const DEFAULT_DRIFT_MS = 1000 * 60 * 60; // 1 hour

const getSecret = (): string | null => {
  const secret =
    process.env.BANNER_CTA_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    null;
  return secret && secret.trim().length > 0 ? secret : null;
};

export const isBannerCtaSignatureEnabled = (): boolean => Boolean(getSecret());

export const signBannerCtaPayload = (payload: BannerCtaPayload): string | null => {
  const secret = getSecret();
  if (!secret) return null;
  const issuedAt = typeof payload.issuedAt === "number" ? payload.issuedAt : Date.now();
  const hmac = createHmac("sha256", secret);
  hmac.update(payload.artistId || "");
  hmac.update("||");
  hmac.update(payload.ctaHref || "");
  hmac.update("||");
  hmac.update(payload.placement || "");
  hmac.update("||");
  hmac.update(String(issuedAt));
  return `${issuedAt}:${hmac.digest("hex")}`;
};

export const verifyBannerCtaSignature = (
  payload: BannerCtaPayload,
  signature: string | null | undefined,
  options: { maxDriftMs?: number } = {}
): boolean => {
  if (!signature) return false;
  const secret = getSecret();
  if (!secret) return false;
  const [issuedAtRaw, hash] = signature.split(":");
  if (!issuedAtRaw || !hash) return false;
  const issuedAt = Number.parseInt(issuedAtRaw, 10);
  if (!Number.isFinite(issuedAt)) return false;
  const now = Date.now();
  const maxDrift = options.maxDriftMs ?? DEFAULT_DRIFT_MS;
  if (Math.abs(now - issuedAt) > maxDrift) {
    return false;
  }
  const expected = signBannerCtaPayload({ ...payload, issuedAt });
  if (!expected) return false;
  const expectedHash = expected.split(":")[1] || "";
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
};
