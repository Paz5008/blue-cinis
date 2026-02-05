import type { Prisma } from '@prisma/client'

export const ADMIN_ARTIST_DETAIL_SELECT = {
  id: true,
  name: true,
  biography: true,
  artStyle: true,
  photoUrl: true,
  contactEmail: true,
  phone: true,
  portfolio: true,
  instagramUrl: true,
  facebookUrl: true,
  enableCommerce: true,
  enableLeads: true,
  allowInternationalShipping: true,
  defaultShippingFee: true,
  processingTimeDays: true,
  deliveryBannerMessage: true,
  isActive: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
} as const

export type AdminArtistDetail = Prisma.ArtistGetPayload<{ select: typeof ADMIN_ARTIST_DETAIL_SELECT }>
