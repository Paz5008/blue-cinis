import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  envMock,
  recordClickMock,
  verifySignatureMock,
  limiterRef,
  limiterLimitMock,
  fallbackLimitMock,
  localLimiterFactory,
} = vi.hoisted(() => {
  const env = { NODE_ENV: "test" };
  const record = vi.fn(async () => undefined);
  const verify = vi.fn(() => true);
  const limitMock = vi.fn();
  const limiter = { current: { limit: limitMock } as { limit: (id: string) => Promise<{ success: boolean; reset: number }> } | undefined };
  const fallbackLimit = vi.fn(() => ({ success: true, reset: Date.now() + 1_000 }));
  const localFactory = vi.fn(() => ({ limit: fallbackLimit }));
  return {
    envMock: env,
    recordClickMock: record,
    verifySignatureMock: verify,
    limiterRef: limiter,
    limiterLimitMock: limitMock,
    fallbackLimitMock: fallbackLimit,
    localLimiterFactory: localFactory,
  };
});

vi.mock("@/env", () => ({ env: envMock }));
vi.mock("@/lib/data/bannerInsights", () => ({ recordBannerCtaClick: recordClickMock }));
vi.mock("@/lib/bannerSignature", () => ({ verifyBannerCtaSignature: verifySignatureMock }));
vi.mock("@/lib/ratelimit", () => ({
  get bannerCtaLimiter() {
    return limiterRef.current;
  },
  getIpFromHeaders: () => "198.51.100.5",
}));
vi.mock("@/lib/localRateLimit", () => ({
  createInMemorySlidingWindowLimiter: localLimiterFactory,
}));

async function getPostHandler() {
  vi.resetModules();
  const mod = await import("../app/api/banner/cta/route");
  return mod.POST;
}

function makeRequest(body: Record<string, unknown>) {
  return {
    headers: new Headers(),
    async json() {
      return body;
    },
  } as any;
}

const basePayload = {
  artistId: "artist_123",
  ctaHref: "https://example.com",
  placement: "hero",
  ctaLabel: "Voir l'œuvre",
  signature: "valid",
};

describe("POST /api/banner/cta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.NODE_ENV = "test";
    limiterRef.current = {
      limit: limiterLimitMock.mockResolvedValue({ success: true, reset: Date.now() + 1_000 }),
    };
    fallbackLimitMock.mockImplementation(() => ({ success: true, reset: Date.now() + 1_000 }));
    localLimiterFactory.mockImplementation(() => ({ limit: fallbackLimitMock }));
    verifySignatureMock.mockReturnValue(true);
  });

  it("rejects invalid signatures", async () => {
    verifySignatureMock.mockReturnValueOnce(false);
    const POST = await getPostHandler();
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(400);
    expect(recordClickMock).not.toHaveBeenCalled();
  });

  it("requires the distributed limiter in production", async () => {
    envMock.NODE_ENV = "production";
    limiterRef.current = undefined;
    const POST = await getPostHandler();
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(503);
    expect(localLimiterFactory).toHaveBeenCalled();
  });

  it("records clicks when limiter allows traffic", async () => {
    const POST = await getPostHandler();
    await POST(makeRequest({ ...basePayload, presetId: "preset_1", source: "banner" }));
    expect(recordClickMock).toHaveBeenCalledWith(
      expect.objectContaining({ artistId: "artist_123", ctaHref: "https://example.com", presetId: "preset_1", source: "banner" }),
    );
  });

  it("propagates rate limit responses from Upstash", async () => {
    limiterLimitMock.mockResolvedValueOnce({ success: false, reset: Date.now() + 5_000 });
    const POST = await getPostHandler();
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(recordClickMock).not.toHaveBeenCalled();
  });

  it("falls back to the in-memory limiter outside production", async () => {
    limiterRef.current = undefined;
    let calls = 0;
    fallbackLimitMock.mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        return { success: true, reset: Date.now() + 1_000 };
      }
      return { success: false, reset: Date.now() + 2_000 };
    });

    const POST = await getPostHandler();
    const okRes = await POST(makeRequest(basePayload));
    expect(okRes.status).toBe(200);

    const blocked = await POST(makeRequest(basePayload));
    expect(blocked.status).toBe(429);
    expect(recordClickMock).toHaveBeenCalledTimes(1);
    expect(fallbackLimitMock).toHaveBeenCalledTimes(2);
  });
});
