import { describe, it, expect, vi, beforeEach } from "vitest";

const mailerSend = vi.fn();
const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};
const limiterMock = {
  limit: vi.fn(),
};
const bcryptHashMock = vi.fn(() => Promise.resolve("hashed-password"));

vi.mock("@/lib/mailer", () => ({
  mailer: {
    send: mailerSend,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/ratelimit", () => ({
  clientRegistrationLimiter: limiterMock,
  getIpFromHeaders: () => "127.0.0.1",
}));

vi.mock("@/env", () => ({
  env: {
    NEXTAUTH_URL: "http://localhost:3000",
    RECAPTCHA_SECRET_KEY: undefined,
  },
}));

vi.mock("@prisma/client", () => ({
  Role: { artist: "artist", client: "client" },
}));

vi.mock("bcrypt", () => ({
  default: { hash: bcryptHashMock },
  hash: bcryptHashMock,
}));

function makeRequest(body: Record<string, any>) {
  return {
    headers: new Headers(),
    async json() {
      return body;
    },
  } as any;
}

async function getPostHandler() {
  const mod = await import("../app/api/client-registration/route");
  return mod.POST;
}

describe("POST /api/client-registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "user_1" });
    limiterMock.limit.mockResolvedValue({ success: true });
    bcryptHashMock.mockResolvedValue("hashed-password");
  });

  it("validates incoming payload", async () => {
    const POST = await getPostHandler();
    const res = await POST(makeRequest({ email: "bad" }));
    expect(res.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects when rate limiter denies the request", async () => {
    const POST = await getPostHandler();
    limiterMock.limit.mockResolvedValueOnce({ success: false });
    const res = await POST(
      makeRequest({ name: "Tom", email: "tom@example.com", password: "Passw0rd!", recaptchaToken: "token" }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate emails", async () => {
    const POST = await getPostHandler();
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "existing" });
    const res = await POST(
      makeRequest({ name: "Tom", email: "tom@example.com", password: "Passw0rd!", recaptchaToken: "token" }),
    );

    expect(res.status).toBe(409);
  });

  it("creates the account and sends the activation email", async () => {
    const POST = await getPostHandler();
    const res = await POST(
      makeRequest({ name: "Tom", email: "tom@example.com", password: "Passw0rd!", recaptchaToken: "token" }),
    );

    expect(res.status).toBe(201);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "tom@example.com",
          password: "hashed-password",
          role: "client",
        }),
      }),
    );
    expect(mailerSend).toHaveBeenCalledTimes(1);
    expect(mailerSend).toHaveBeenCalledWith(expect.objectContaining({ to: "tom@example.com" }));
  });
});
