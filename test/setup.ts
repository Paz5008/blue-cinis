import { vi } from 'vitest'

// Mock next-auth to avoid ESM/Next.js server resolution issues
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

// Silence logs during tests
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent'

// Provide deterministic admin overrides and secrets for unit tests
process.env.ADMIN_OVERRIDE_EMAILS = process.env.ADMIN_OVERRIDE_EMAILS || 'artist@example.com'
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-value'

// Force the lightweight Prisma mock to avoid DB/network access in Vitest
process.env.PRISMA_MOCK = process.env.PRISMA_MOCK || '1'

// Allow API tests to run without enforcing MFA unless explicitly opted-in
process.env.ADMIN_MFA_BYPASS = process.env.ADMIN_MFA_BYPASS || '1'

// Default Stripe key to keep modules that instantiate Stripe quiet during tests
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
