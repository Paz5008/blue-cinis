import { prisma } from '@/lib/prisma'

export async function cleanupExpiredReservations() {
  const now = new Date()
  const [reservations, artworks] = await Promise.all([
    prisma.reservation.updateMany({
      where: { status: 'active', expiresAt: { lt: now } },
      data: { status: 'expired' },
    }),
    prisma.artwork.updateMany({
      where: { reservedUntil: { lt: now } },
      data: { reservedUntil: null },
    }),
  ])
  return { expiredReservations: reservations.count, clearedArtworks: artworks.count }
}
