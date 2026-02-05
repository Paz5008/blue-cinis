import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const {
  prismaMock,
  mailerSend,
  mailerIsConfigured,
  envMock,
  leadsLimiterLimit,
  leadsLimiterRef,
  ipRef,
} = vi.hoisted(() => {
  const prisma = {
    artwork: { findUnique: vi.fn() },
    lead: { create: vi.fn() },
    artist: { findUnique: vi.fn() },
  };
  const send = vi.fn(async () => ({ ok: true }));
  const isConfigured = vi.fn(() => true);
  const env = {
    SALES_EMAIL: "sales@example.com",
    SMTP_USER: "smtp@example.com",
    NODE_ENV: "test",
    RECAPTCHA_SECRET_KEY: "",
  };
  const limiterLimit = vi.fn();
  const limiterRef = { current: { limit: limiterLimit } as { limit: typeof limiterLimit } | undefined };
  const ipTracker = { current: "127.0.0.1" };
  return {
    prismaMock: prisma,
    mailerSend: send,
    mailerIsConfigured: isConfigured,
    envMock: env,
    leadsLimiterLimit: limiterLimit,
    leadsLimiterRef: limiterRef,
    ipRef: ipTracker,
  };
});

vi.mock("@/lib/mailer", () => ({
  mailer: {
    send: mailerSend,
    isConfigured: mailerIsConfigured,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/ratelimit", () => ({
  get leadsLimiter() {
    return leadsLimiterRef.current;
  },
  getIpFromHeaders: () => ipRef.current,
}));

vi.mock("@/env", () => ({
  env: envMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/req", () => ({
  getRequestId: () => "req_test",
}));

async function getPostHandler() {
  vi.resetModules();
  const mod = await import("../app/api/leads/route");
  return mod.POST;
}

function makeReq(body: any, contentType = "application/json") {
  const headers = new Headers({ "content-type": contentType });
  return {
    headers,
    async json() {
      return body;
    },
    async formData() {
      const form = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        form.append(key, value as string);
      });
      return form;
    },
  } as any;
}

const originalFetch = global.fetch;

function mockRecaptcha(ok: boolean) {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: ok }),
  } as any);
}

describe("POST /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.NODE_ENV = "test";
    envMock.RECAPTCHA_SECRET_KEY = "";
    envMock.SALES_EMAIL = "sales@example.com";
    envMock.SMTP_USER = "smtp@example.com";
    leadsLimiterRef.current = { limit: leadsLimiterLimit };
    leadsLimiterLimit.mockResolvedValue({ success: true, reset: Date.now() + 1_000 });
    ipRef.current = "203.0.113.10";
    prismaMock.artwork.findUnique.mockResolvedValue(null);
    prismaMock.artist.findUnique.mockResolvedValue({ user: { email: "artist@example.com" } });
    prismaMock.lead.create.mockResolvedValue({ id: "lead_123" });
    mailerIsConfigured.mockReturnValue(true);
    mailerSend.mockResolvedValue({ ok: true });
    mockRecaptcha(true);
  });

  afterAll(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    }
  });

  it("returns 400 on invalid payload", async () => {
    const POST = await getPostHandler();
    const res = await POST(makeReq({ email: "bad" }));
    expect(res.status).toBe(400);
    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });

  it("rejects missing reCAPTCHA token in production", async () => {
    envMock.NODE_ENV = "production";
    const POST = await getPostHandler();
    const res = await POST(makeReq({ name: "Jane", email: "jane@example.com" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "reCAPTCHA requis" });
  });

  it("rejects invalid reCAPTCHA verification", async () => {
    envMock.NODE_ENV = "production";
    envMock.RECAPTCHA_SECRET_KEY = "secret";
    mockRecaptcha(false);
    const POST = await getPostHandler();
    const res = await POST(makeReq({ name: "Jane", email: "jane@example.com", recaptchaToken: "bad" }));
    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "reCAPTCHA invalide" });
  });

  it("uses the fallback limiter when Upstash is unavailable", async () => {
    leadsLimiterRef.current = undefined;
    const POST = await getPostHandler();
    for (let i = 0; i < 5; i += 1) {
      const okRes = await POST(makeReq({ name: `User ${i}`, email: `user${i}@example.com` }));
      expect(okRes.status).toBe(201);
    }
    const blocked = await POST(makeReq({ name: "Flood", email: "flood@example.com" }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("creates a lead and sanitizes the notification payload", async () => {
    prismaMock.artwork.findUnique.mockResolvedValue({
      id: "art_unsafe",
      artistId: "artist<script>",
      title: "<b>Unsafe</b>",
      artist: { user: { email: "artist@example.com" } },
    });
    const POST = await getPostHandler();
    const res = await POST(
      makeReq({
        name: "Alice <script>alert(1)</script>",
        email: "alice@example.com",
        phone: "<bad>",
        message: "Line1\n<script>xss()</script>",
        artworkId: "art_unsafe",
      }),
    );
    expect(res.status).toBe(201);
    const html = mailerSend.mock.calls[0][0].html || "";
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<br/>");
  });

  it("returns 503 in production when notification email is missing", async () => {
    envMock.NODE_ENV = "production";
    envMock.RECAPTCHA_SECRET_KEY = "secret";
    envMock.SALES_EMAIL = "";
    envMock.SMTP_USER = "";
    const POST = await getPostHandler();
    const res = await POST(makeReq({ name: "Jane", email: "jane@example.com", recaptchaToken: "token" }));
    expect(res.status).toBe(503);
    expect(mailerSend).not.toHaveBeenCalled();
  });

  it("returns 503 in production when the mailer is not configured", async () => {
    envMock.NODE_ENV = "production";
    envMock.RECAPTCHA_SECRET_KEY = "secret";
    mailerIsConfigured.mockReturnValue(false);
    const POST = await getPostHandler();
    const res = await POST(makeReq({ name: "Jane", email: "jane@example.com", recaptchaToken: "token" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "Notifications indisponibles" });
  });

  it("propagates upstream rate-limit errors", async () => {
    leadsLimiterLimit.mockResolvedValueOnce({ success: false, reset: Date.now() + 5_000 });
    const POST = await getPostHandler();
    const res = await POST(makeReq({ name: "John", email: "john@example.com" }));
    expect(res.status).toBe(429);
    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });

  it("returns 500 when lead creation fails", async () => {
    prismaMock.lead.create.mockRejectedValueOnce(new Error("db down"));

    const POST = await getPostHandler();
    const res = await POST(makeReq({ name: "Ana", email: "ana@example.com" }));
    expect(res.status).toBe(500);
    expect(mailerSend).not.toHaveBeenCalled();
  });
});
