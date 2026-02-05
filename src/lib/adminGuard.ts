import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'
import { isAdmin } from '@/lib/authz'
import { buildAdminLoginRedirect, sanitizeAdminReturnPath } from '@/lib/adminReturnPath'

export class AdminAccessError extends Error {
  constructor(message = 'Administrator privileges required') {
    super(message)
    this.name = 'AdminAccessError'
  }
}

export async function ensureAdminSession(): Promise<Session | null> {
  const session = await auth()
  if (!session || !isAdmin(session.user)) {
    return null
  }
  return session
}

export async function requireAdminSession(): Promise<Session> {
  const session = await ensureAdminSession()
  if (!session) {
    throw new AdminAccessError()
  }
  return session
}

export async function requireAdminSessionOrRedirect(returnPath?: string) {
  const session = await ensureAdminSession()
  if (!session) {
    redirect(buildAdminLoginRedirect(returnPath))
  }
  return session
}

export function resolveAdminReturnPath(value?: string | null) {
  return sanitizeAdminReturnPath(value) ?? '/admin'
}
