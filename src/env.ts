import { z } from 'zod'

// Centralise and validate environment variables.
// Keep most keys optional for development to avoid crashing local runs.
// In production, set NODE_ENV=production and ensure required keys are provided.

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  SHADOW_DATABASE_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),

  // SMTP (optional in dev)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SALES_EMAIL: z.string().email().optional(),

  // Stripe / payments
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PM_TYPES: z.string().optional(),
  STRIPE_ENABLE_TAX: z.string().optional(),
  STRIPE_SHIPPING_RATES: z.string().optional(),
  STRIPE_SHIPPING_COUNTRIES: z.string().optional(),
  STRIPE_SHIPPING_ADDRESS_COLLECTION: z.string().optional(),
  STRIPE_SHIPPING_MIN_TOTAL: z.string().optional(),
  STRIPE_SHIPPING_MAX_TOTAL: z.string().optional(),
  STRIPE_SHIPPING_TAX_BEHAVIOR: z.string().optional(),
  PAYMENTS_PROVIDER: z.string().optional(),

  ENABLE_DEV_AUTO_USER: z.string().optional(),
  ALLOW_ANONYMOUS_CANVAS_PREVIEW: z.string().optional(),
  ADMIN_EXPORT_STORAGE_PROVIDER: z.string().optional(),

  // Recaptcha (optional)
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  // Marketing / newsletter
  NEWSLETTER_PROVIDER: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  BREVO_LIST_ID: z.string().optional(),

  // Domain / URLs
  DOMAIN: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),

  // Inventory / reservations
  RESERVATION_TTL_MIN: z.string().optional(),

  // Redis / Upstash
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().optional(),
  CLOUDINARY_AUTHENTICATED: z.enum(['true', 'false']).optional(),
  CLOUDINARY_SIGNED_TTL: z.string().optional(),

  // Monitoring / cron
  CRON_CLEANUP_SECRET: z.string().optional(),
})

const parsed = baseSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('[env] Invalid environment variables', parsed.error.flatten())
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[env] Invalid environment, aborting bootstrap')
  }
}

const env = parsed.success ? parsed.data : (process.env as any)
const isProd = env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION !== 'true'

function collectMissing(condition: unknown, label: string, bucket: string[]) {
  if (!condition) bucket.push(label)
}

// Extra guards for production
if (isProd) {
  const missing: string[] = []

  collectMissing(env.NEXTAUTH_SECRET, 'NEXTAUTH_SECRET', missing)
  collectMissing(env.DATABASE_URL, 'DATABASE_URL', missing)
  collectMissing(env.DOMAIN || env.NEXTAUTH_URL, 'DOMAIN or NEXTAUTH_URL', missing)
  collectMissing(env.NEXT_PUBLIC_BASE_URL, 'NEXT_PUBLIC_BASE_URL', missing)

  const hasSmtp = env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS
  collectMissing(hasSmtp, 'SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS', missing)
  collectMissing(env.SALES_EMAIL, 'SALES_EMAIL', missing)
  collectMissing(env.RECAPTCHA_SECRET_KEY, 'RECAPTCHA_SECRET_KEY', missing)

  const hasStripeCore = env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  collectMissing(hasStripeCore, 'STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', missing)
  collectMissing(env.STRIPE_SHIPPING_RATES, 'STRIPE_SHIPPING_RATES', missing)
  collectMissing(env.STRIPE_SHIPPING_COUNTRIES, 'STRIPE_SHIPPING_COUNTRIES', missing)

  const hasUpstash = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  collectMissing(hasUpstash, 'UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN', missing)

  const hasCloudinary =
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET &&
    env.CLOUDINARY_AUTHENTICATED === 'true'
  collectMissing(hasCloudinary, 'CLOUDINARY_* + CLOUDINARY_AUTHENTICATED=true', missing)
  collectMissing(env.CLOUDINARY_SIGNED_TTL, 'CLOUDINARY_SIGNED_TTL', missing)

  const newsletterProvider = (env.NEWSLETTER_PROVIDER || '').toLowerCase()
  if (!newsletterProvider || newsletterProvider === 'disabled') {
    missing.push('NEWSLETTER_PROVIDER=brevo')
  } else if (newsletterProvider !== 'brevo') {
    missing.push('NEWSLETTER_PROVIDER (only "brevo" supported)')
  }
  if (newsletterProvider === 'brevo') {
    collectMissing(env.BREVO_API_KEY, 'BREVO_API_KEY', missing)
    collectMissing(env.BREVO_LIST_ID, 'BREVO_LIST_ID', missing)
  }

  if (env.ALLOW_ANONYMOUS_CANVAS_PREVIEW === '1') {
    missing.push('ALLOW_ANONYMOUS_CANVAS_PREVIEW must stay 0 in production')
  }

  if (missing.length) {
    const message = `[env] Missing required env in production: ${missing.join(', ')}`
    console.error(message)
    throw new Error(message)
  }
} else {
  // helpful hints for local runs
  const optionalWarnings: string[] = []
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) optionalWarnings.push('SMTP')
  if (!env.STRIPE_SECRET_KEY) optionalWarnings.push('Stripe')
  if (!env.RECAPTCHA_SECRET_KEY) optionalWarnings.push('reCAPTCHA')
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) optionalWarnings.push('Upstash/Redis')
  if (!env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_AUTHENTICATED !== 'true') optionalWarnings.push('Cloudinary')
  if (!env.NEWSLETTER_PROVIDER) optionalWarnings.push('Newsletter provider')

  if (optionalWarnings.length) {
    console.warn(`[env] Missing optional integrations for local/dev: ${optionalWarnings.join(', ')}`)
  }
}

export { env }
