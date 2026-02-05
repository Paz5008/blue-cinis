import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());

const mailerSend = vi.fn();
const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  artist: {
    create: vi.fn(),
  },
};
const limiterMock = {
  limit: vi.fn(),
};

const bcryptHashMock = vi.fn(() => Promise.resolve("hashed-password"));

vi.stubGlobal("fetch", fetchMock);

vi.mock("@/lib/mailer", () => ({
  mailer: {
    send: mailerSend,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/ratelimit", () => ({
  artistRegistrationLimiter: limiterMock,
  getIpFromHeaders: () => "127.0.0.1",
}));

vi.mock("@/env", () => ({
  env: {
    NEXTAUTH_URL: "http://localhost:3000",
    RECAPTCHA_SECRET_KEY: "test-secret",
    SALES_EMAIL: "sales@example.com",
    SMTP_USER: "smtp@example.com",
  },
}));

vi.mock("@prisma/client", () => ({
  Role: { artist: "artist", client: "client" },
}));

vi.mock("bcrypt", () => ({
  default: { hash: bcryptHashMock },
  hash: bcryptHashMock,
}));

function makeRequest(fields: Record<string, string | undefined>) {
  const form = new FormData();
  Object.entries({ recaptchaToken: "test-token", ...fields }).forEach(([key, value]) => {
    if (typeof value !== "undefined") {
      form.append(key, value);
    }
  });
  return {
    headers: new Headers(),
    async formData() {
      return form;
    },
  } as any;
}

async function getPostHandler() {
  const mod = await import("../app/api/artist-registration/route");
  return mod.POST;
}

describe("POST /api/artist-registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({
      json: async () => ({ success: true }),
    } as any);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "user_1" });
    prismaMock.artist.create.mockResolvedValue({ id: "artist_1" });
    limiterMock.limit.mockResolvedValue({ success: true });
    bcryptHashMock.mockResolvedValue("hashed-password");
  });

  it("returns 400 when payload is invalid", async () => {
    const POST = await getPostHandler();
    const res = await POST(makeRequest({ email: "bad-email" }));

    expect(res.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    const POST = await getPostHandler();
    limiterMock.limit.mockResolvedValueOnce({ success: false });
    const res = await POST(
      makeRequest({
        name: "Jane",
        email: "jane@example.com",
        password: "Passw0rd!",
        artStyle: "Oil",
        message: "Hello",
      }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns 409 when email already exists", async () => {
    const POST = await getPostHandler();
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "existing" });
    const res = await POST(
      makeRequest({
        name: "Jane",
        email: "jane@example.com",
        password: "Passw0rd!",
        artStyle: "Oil",
        message: "Hello",
      }),
    );

    expect(res.status).toBe(409);
    expect(prismaMock.artist.create).not.toHaveBeenCalled();
  });

  it("creates the user, artist profile and sends emails", async () => {
    const POST = await getPostHandler();
    const res = await POST(
      makeRequest({
        name: "Jane",
        email: "jane@example.com",
        password: "Passw0rd!",
        artStyle: "Oil",
        message: "Hello",
        phone: "0600000000",
        portfolio: "https://portfolio.test",
      }),
    );

    expect(res.status).toBe(201);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "jane@example.com",
          password: "hashed-password",
          role: "artist",
        }),
      }),
    );
    expect(prismaMock.artist.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          biography: "Hello",
          phone: "0600000000",
        }),
      }),
    );
    expect(mailerSend).toHaveBeenCalledTimes(2);
    expect(mailerSend).toHaveBeenCalledWith(expect.objectContaining({ to: "sales@example.com" }));
    expect(mailerSend).toHaveBeenCalledWith(expect.objectContaining({ to: "jane@example.com" }));
  });
});
