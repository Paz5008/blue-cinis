const rawAdminOverrides = (process.env.ADMIN_OVERRIDE_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

const hasConfiguredAdmins = rawAdminOverrides.length > 0
const missingAdminsMessage = '[authz] ADMIN_OVERRIDE_EMAILS doit contenir au moins une adresse administrateur'

if (!hasConfiguredAdmins) {
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION !== 'true') {
    throw new Error(missingAdminsMessage)
  }
  console.warn(missingAdminsMessage)
}

const adminEmailAllowList = new Set(rawAdminOverrides)

export function isAdmin(user: any): boolean {
  if (!user) {
    return false
  }
  if (user.role === 'admin') {
    return true
  }
  const email = typeof user.email === 'string' ? user.email.toLowerCase() : ''
  return email ? adminEmailAllowList.has(email) : false
}

export function isArtist(user: any): boolean {
  return !!user && (user.role === 'artist')
}
