import { describe, it, expect, vi, beforeEach } from 'vitest'

const authMock = vi.fn()

vi.mock('@/auth', () => ({
  auth: (...args: any[]) => authMock(...args),
}))

vi.mock('@/lib/authz', () => ({
  isAdmin: (user: any) => user?.role === 'admin',
  isArtist: (user: any) => user?.role === 'artist',
}))

vi.mock('@/lib/artist-profile', () => ({
  ensureArtistProfile: vi.fn(),
}))

import { ensureArtistSession, requireArtistSession } from '@/lib/artistGuard'

describe('artistGuard', () => {
  beforeEach(() => {
    authMock.mockReset()
  })

  it('returns null when no artist session is available', async () => {
    authMock.mockResolvedValueOnce(null)
    const session = await ensureArtistSession()
    expect(session).toBeNull()
  })

  it('allows artist role', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    const session = await ensureArtistSession()
    expect(session?.user.id).toBe('u1')
  })

  it('denies non-artist when admin access is not allowed', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u2', role: 'client' } })
    const session = await ensureArtistSession()
    expect(session).toBeNull()
  })

  it('allows admin when allowAdmin is true', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'admin1', role: 'admin' } })
    const session = await ensureArtistSession({ allowAdmin: true })
    expect(session?.user.id).toBe('admin1')
  })

  it('requireArtistSession throws when unauthorized', async () => {
    authMock.mockResolvedValueOnce(null)
    await expect(requireArtistSession()).rejects.toThrow(/Artist privileges required/)
  })
})
