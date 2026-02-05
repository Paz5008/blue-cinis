import { cleanupExpiredReservations } from '@/jobs/cleanupReservations'

async function main() {
  const { expiredReservations, clearedArtworks } = await cleanupExpiredReservations()
  console.log(`Expired reservations: ${expiredReservations}, cleared legacy reservedUntil on artworks: ${clearedArtworks}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
