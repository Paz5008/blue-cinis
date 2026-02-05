import type { Prisma } from '@prisma/client'

export const ADMIN_ARTWORK_DETAIL_SELECT = {
  id: true,
  title: true,
  artistId: true,
  artistName: true,
  price: true,
  imageUrl: true,
  description: true,
  dimensions: true,
  year: true,
  categoryId: true,
  stockQuantity: true,
  isAvailable: true,
  reservedUntil: true,
  createdAt: true,
  updatedAt: true,
} as const

export type AdminArtworkDetail = Prisma.ArtworkGetPayload<{ select: typeof ADMIN_ARTWORK_DETAIL_SELECT }>
