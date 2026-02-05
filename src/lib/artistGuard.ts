import { auth } from '@/auth'
import type { Session } from 'next-auth'
// import { authOptions } from '@/lib/auth' // Unused with auth() helper
import { isAdmin, isArtist } from '@/lib/authz'
import { ensureArtistProfile } from '@/lib/artist-profile'

type GuardOptions = {
  allowAdmin?: boolean
}

export type ArtistSession = Session & {
  user: Session['user'] & { id: string }
}

export class ArtistAccessError extends Error {
  constructor(message = 'Artist privileges required') {
    super(message)
    this.name = 'ArtistAccessError'
  }
}

export async function ensureArtistSession(options?: GuardOptions): Promise<ArtistSession | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  if (isArtist(session.user) || (options?.allowAdmin && isAdmin(session.user))) {
    return session as ArtistSession
  }
  return null
}

export async function requireArtistSession(options?: GuardOptions): Promise<ArtistSession> {
  const session = await ensureArtistSession(options)
  if (!session) {
    throw new ArtistAccessError()
  }
  return session
}

type ContextOptions<TSelect> = GuardOptions & {
  select?: TSelect
  createIfMissing?: boolean
}

export async function ensureArtistContext<TSelect = undefined>(
  options?: ContextOptions<TSelect>,
): Promise<{ session: ArtistSession; artist: any } | null> {
  const session = await ensureArtistSession(options)
  if (!session) {
    return null
  }
  const artist = await ensureArtistProfile(session, {
    select: options?.select as any,
    createIfMissing: options?.createIfMissing ?? true,
  })
  if (!artist) {
    return null
  }
  return { session, artist }
}

export async function requireArtistContext<TSelect = undefined>(
  options?: ContextOptions<TSelect>,
) {
  const context = await ensureArtistContext(options)
  if (!context) {
    throw new ArtistAccessError('Artist profile required')
  }
  return context
}
