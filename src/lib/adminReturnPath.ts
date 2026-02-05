function sanitizeAdminReturnPath(path?: string | null) {
  if (!path) return null;
  if (!path.startsWith('/')) return null;
  const fallback = '/admin';
  try {
    const url = new URL(path, 'http://localhost');
    if (!url.pathname.startsWith('/admin')) {
      return fallback;
    }
    const search = url.search ?? '';
    const hash = url.hash ?? '';
    const normalized = `${url.pathname}${search}${hash}`;
    return normalized || fallback;
  } catch {
    return fallback;
  }
}

export function resolveAdminReturnPath(value?: string | null) {
  return sanitizeAdminReturnPath(value) ?? '/admin';
}

export function buildAdminLoginRedirect(returnTo?: string | null) {
  const sanitized = sanitizeAdminReturnPath(returnTo);
  const params = new URLSearchParams({ auth: 'required' });
  if (sanitized && sanitized !== '/admin') {
    params.set('returnTo', sanitized);
  }
  return `/admin?${params.toString()}`;
}

export { sanitizeAdminReturnPath };
