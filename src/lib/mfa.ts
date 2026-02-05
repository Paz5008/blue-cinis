import crypto from 'crypto'
import { sharedRedis } from '@/lib/ratelimit'
import { mailer } from '@/lib/mailer'
import { maskEmail } from '@/lib/redact'
import { env } from '@/env'

const CHALLENGE_PREFIX = 'admin:mfa:challenge:'
const TOKEN_PREFIX = 'admin:mfa:token:'
const CHALLENGE_TTL_SECONDS = 5 * 60
const TOKEN_TTL_SECONDS = 10 * 60
const MAX_ATTEMPTS = 5

type ChallengeRecord = {
  id: string
  userId: string
  scope: string
  codeHash: string
  salt: string
  expiresAt: number
  attempts: number
  email?: string | null
}

type TokenRecord = {
  tokenHash: string
  userId: string
  scope: string
  expiresAt: number
}

const allowMemoryStore = env.NODE_ENV !== 'production'
const memoryStore = allowMemoryStore ? new Map<string, { expiresAt: number; value: any }>() : null

const scopeLabels: Record<string, string> = {
  'orders.refund': 'Remboursement de commande',
  'artworks.delete': 'Suppression d\'une oeuvre',
  'webhooks.replay': 'Rejeu d\'un webhook',
}

export class MfaError extends Error {
  code: string
  details?: Record<string, unknown>

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.details = details
  }
}

function now() {
  return Date.now()
}

async function storeValue(key: string, value: any, ttlSeconds: number) {
  if (sharedRedis) {
    await sharedRedis.set(key, JSON.stringify(value), { ex: ttlSeconds })
    return
  }
  if (!memoryStore) throw new MfaError('store_unavailable', 'MFA store unavailable (Redis required)')
  memoryStore.set(key, { expiresAt: now() + ttlSeconds * 1000, value })
}

async function readValue<T>(key: string): Promise<T | null> {
  if (sharedRedis) {
    const raw = await sharedRedis.get(key)
    if (!raw || typeof raw !== 'string') return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  if (!memoryStore) throw new MfaError('store_unavailable', 'MFA store unavailable (Redis required)')
  const entry = memoryStore.get(key)
  if (!entry) return null
  if (entry.expiresAt <= now()) {
    memoryStore.delete(key)
    return null
  }
  return entry.value as T
}

async function deleteValue(key: string) {
  if (sharedRedis) {
    await sharedRedis.del(key)
    return
  }
  if (!memoryStore) throw new MfaError('store_unavailable', 'MFA store unavailable (Redis required)')
  memoryStore.delete(key)
}

function randomCode() {
  return String(100000 + Math.floor(Math.random() * 900000))
}

function randomSalt() {
  return crypto.randomBytes(8).toString('hex')
}

function randomToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function describeScope(scope: string) {
  return scopeLabels[scope] || 'Action sensible'
}

function secondsUntil(expiration: number) {
  const diff = Math.max(0, expiration - now())
  return Math.ceil(diff / 1000)
}

export type StartMfaChallengeResult = {
  challengeId: string
  expiresAt: string
  delivery: {
    channel: 'email'
    maskedDestination: string | null
  }
  debugCode?: string
}

export async function startMfaChallenge({
  userId,
  email,
  scope,
  actorEmail,
}: {
  userId: string
  email?: string | null
  scope: string
  actorEmail?: string | null
}): Promise<StartMfaChallengeResult> {
  if (!userId) {
    throw new MfaError('invalid_actor', 'Utilisateur requis pour le MFA.')
  }
  const code = randomCode()
  const salt = randomSalt()
  const challengeId = crypto.randomUUID()
  const expiresAt = now() + CHALLENGE_TTL_SECONDS * 1000
  const record: ChallengeRecord = {
    id: challengeId,
    userId,
    scope,
    codeHash: hashValue(`${code}:${salt}`),
    salt,
    expiresAt,
    attempts: 0,
    email: email ?? actorEmail ?? null,
  }
  await storeValue(`${CHALLENGE_PREFIX}${challengeId}`, record, CHALLENGE_TTL_SECONDS)

  const recipient = record.email
  if (recipient) {
    const subject = `[Loire Admin] Code MFA - ${describeScope(scope)}`
    const html = `
      <p>Bonjour,</p>
      <p>Votre code de confirmation pour ${describeScope(scope)} est :</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
      <p>Ce code expire dans ${Math.round(CHALLENGE_TTL_SECONDS / 60)} minutes.</p>
      <p>Si vous n'etes pas a l'origine de cette demande, changez immediatement votre mot de passe.</p>
    `
    const text = `Code de confirmation: ${code} (exp: ${Math.round(CHALLENGE_TTL_SECONDS / 60)} minutes)`
    await mailer.send({ to: recipient, subject, html, text })
  }

  const response: StartMfaChallengeResult = {
    challengeId,
    expiresAt: new Date(expiresAt).toISOString(),
    delivery: {
      channel: 'email',
      maskedDestination: maskEmail(recipient),
    },
  }

  if (process.env.NODE_ENV !== 'production' && !mailer.isConfigured()) {
    response.debugCode = code
  }

  return response
}

export type VerifyMfaChallengeResult = {
  token: string
  scope: string
  expiresAt: string
}

export async function verifyMfaChallenge({
  challengeId,
  code,
  userId,
  scope,
}: {
  challengeId: string
  code: string
  userId: string
  scope: string
}): Promise<VerifyMfaChallengeResult> {
  if (!challengeId || !code) {
    throw new MfaError('invalid_payload', 'Challenge et code requis.')
  }
  const key = `${CHALLENGE_PREFIX}${challengeId}`
  const record = await readValue<ChallengeRecord>(key)
  if (!record) {
    throw new MfaError('expired', 'Challenge introuvable ou expire.')
  }
  if (record.userId !== userId) {
    throw new MfaError('mismatch', 'Challenge invalide pour cet utilisateur.')
  }
  if (record.scope !== scope) {
    throw new MfaError('scope_mismatch', 'Challenge invalide pour cette action.')
  }
  if (record.expiresAt <= now()) {
    await deleteValue(key)
    throw new MfaError('expired', 'Challenge expire, demandez un nouveau code.')
  }

  const hashed = hashValue(`${code}:${record.salt}`)
  if (hashed !== record.codeHash) {
    const attempts = record.attempts + 1
    if (attempts >= MAX_ATTEMPTS) {
      await deleteValue(key)
      throw new MfaError('too_many_attempts', 'Nombre maximal de tentatives atteint.')
    }
    record.attempts = attempts
    await storeValue(key, record, Math.max(10, secondsUntil(record.expiresAt)))
    throw new MfaError('invalid_code', 'Code incorrect.')
  }

  await deleteValue(key)

  const token = randomToken()
  const expiresAt = now() + TOKEN_TTL_SECONDS * 1000
  const tokenRecord: TokenRecord = {
    tokenHash: hashValue(token),
    userId,
    scope: record.scope,
    expiresAt,
  }
  await storeValue(`${TOKEN_PREFIX}${tokenRecord.tokenHash}`, tokenRecord, TOKEN_TTL_SECONDS)

  return {
    token,
    scope: record.scope,
    expiresAt: new Date(expiresAt).toISOString(),
  }
}

export type ValidateMfaTokenResult =
  | { ok: true }
  | { ok: false; reason: 'missing_token' | 'invalid_token' | 'expired' | 'mismatch' | 'scope_mismatch' | 'missing_actor' }

export type MfaFailureReason = Extract<ValidateMfaTokenResult, { ok: false }>['reason']

export async function validateMfaToken({
  token,
  userId,
  scope,
  consume = true,
}: {
  token?: string | null
  userId?: string | null
  scope: string
  consume?: boolean
}): Promise<ValidateMfaTokenResult> {
  if (!userId) {
    return { ok: false, reason: 'missing_actor' }
  }
  if (!token) {
    return { ok: false, reason: 'missing_token' }
  }
  const key = `${TOKEN_PREFIX}${hashValue(token)}`
  const record = await readValue<TokenRecord>(key)
  if (!record) {
    return { ok: false, reason: 'invalid_token' }
  }
  if (record.userId !== userId) {
    return { ok: false, reason: 'mismatch' }
  }
  if (record.scope !== scope) {
    return { ok: false, reason: 'scope_mismatch' }
  }
  if (record.expiresAt <= now()) {
    await deleteValue(key)
    return { ok: false, reason: 'expired' }
  }

  if (consume) {
    await deleteValue(key)
  }
  return { ok: true }
}

export function describeMfaFailure(reason?: MfaFailureReason) {
  switch (reason) {
    case 'missing_token':
      return 'Jeton MFA manquant.'
    case 'invalid_token':
      return 'Jeton MFA invalide ou expire.'
    case 'expired':
      return 'Jeton MFA expire.'
    case 'mismatch':
      return 'Jeton MFA non associe a cette session.'
    case 'scope_mismatch':
      return 'Jeton MFA non valide pour cette action.'
    case 'missing_actor':
      return 'Session administrateur requise.'
    default:
      return 'Validation MFA requise.'
  }
}
