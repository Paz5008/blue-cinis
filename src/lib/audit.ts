import type { Session } from 'next-auth'
import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

type AuditStatus = 'success' | 'denied' | 'error'

type RequestLike =
  | NextRequest
  | {
      headers?: Headers
      ip?: string | null
    }

type AuditLogInput = {
  action: string
  resource?: string
  session?: Session | null
  metadata?: Record<string, unknown> | null
  status?: AuditStatus
  request?: RequestLike | null
  ipAddress?: string | null
  userAgent?: string | null
}

function resolveIp(input?: RequestLike | null): string | null {
  if (!input) return null
  if ('ip' in input) {
    const inferred = (input as any).ip ?? (input as { ip?: string | null }).ip
    if (typeof inferred === 'string' && inferred) {
      return inferred
    }
  }
  const headers = 'headers' in input ? input.headers : undefined
  const forwarded = headers?.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = headers?.get('x-real-ip')
  if (realIp) return realIp
  return null
}

function resolveUserAgent(input?: RequestLike | null): string | null {
  const headers = input && 'headers' in input ? input.headers : undefined
  if (!headers) return null
  return headers.get('user-agent')
}

export async function recordAdminAuditLog({
  action,
  resource,
  session,
  metadata,
  status = 'success',
  request,
  ipAddress,
  userAgent,
}: AuditLogInput) {
  if (!action) {
    logger.warn('[audit] action manquant pour le log admin')
    return
  }
  const actorId = typeof session?.user?.id === 'string' ? session.user.id : null
  const actorEmail = typeof session?.user?.email === 'string' ? session.user.email : null
  const ip = ipAddress ?? resolveIp(request)
  const agent = userAgent ?? resolveUserAgent(request)
  const payload: Prisma.JsonValue | null = {
    ...(metadata ?? {}),
    status,
  }

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        actorEmail,
        action,
        resource,
        ipAddress: ip,
        userAgent: agent,
        metadata: payload,
      },
    })
  } catch (error) {
    logger.error({ error, action, resource }, '[audit] Échec enregistrement audit admin')
  }
}
