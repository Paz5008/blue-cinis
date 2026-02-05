import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { buildArtworkQuery, resolveArtworkFilters } from '@/lib/adminFilters'
import { z } from 'zod'
import { revalidateInventory } from '@/lib/revalidateInventory'

export async function GET(req: NextRequest) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const url = new URL(req.url)
  const filters = resolveArtworkFilters(Object.fromEntries(url.searchParams))
  const { where, orderBy } = buildArtworkQuery(filters)
  const total = await prisma.artwork.count({ where })
  const items = await prisma.artwork.findMany({
    where,
    orderBy,
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
    select: { id: true, title: true, price: true, imageUrl: true, artistName: true },
  })

  await recordAdminAuditLog({
    action: 'artworks.list',
    resource: `artworks?page=${filters.page}`,
    session,
    request: req,
    metadata: { pageSize: filters.pageSize, filters: { q: Boolean(filters.q), sort: filters.sort }, returned: items.length },
  })
  return NextResponse.json({ page: filters.page, pageSize: filters.pageSize, total, items })
}

const createArtworkSchema = z.object({
  title: z.string().trim().min(2).max(255),
  artistId: z.string().trim().min(1),
  price: z.coerce.number().int().min(0),
  imageUrl: z.string().trim().min(4).max(2048),
  description: z.string().trim().max(4000).optional(),
  dimensions: z.string().trim().max(255).optional(),
  year: z.coerce.number().int().min(1000).max(9999).optional(),
  isAvailable: z.boolean().optional(),
  stockQuantity: z.coerce.number().int().min(0).max(1000).optional(),
})

export async function POST(req: NextRequest) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const payload = await req.json().catch(() => null)
  const parsed = createArtworkSchema.safeParse(payload)
  if (!parsed.success) {
    await recordAdminAuditLog({
      action: 'artworks.create',
      resource: 'artwork',
      session,
      request: req,
      status: 'denied',
      metadata: { reason: 'invalid_payload' },
    })
    return NextResponse.json({ error: 'Champs invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const data = parsed.data
    const artist = await prisma.artist.findUnique({ where: { id: data.artistId }, select: { id: true, name: true } })
    if (!artist) {
      await recordAdminAuditLog({
        action: 'artworks.create',
        resource: 'artwork',
        session,
        request: req,
        status: 'denied',
        metadata: { reason: 'artist_not_found' },
      })
      return NextResponse.json({ error: 'Artiste introuvable' }, { status: 400 })
    }
    const created = await prisma.artwork.create({
      data: {
        title: data.title,
        price: data.price,
        imageUrl: data.imageUrl,
        description: data.description,
        dimensions: data.dimensions,
        year: data.year,
        status: (data.isAvailable ?? true) ? 'available' : 'sold',
        stockQuantity: data.stockQuantity,
        artistId: artist.id,
        artistName: artist.name,
      },
      select: { id: true, title: true, price: true, imageUrl: true, artistName: true },
    })
    await revalidateInventory({ artworkIds: [created.id] })
    await recordAdminAuditLog({
      action: 'artworks.create',
      resource: created.id,
      session,
      request: req,
      metadata: { artistId: artist.id },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/admin/artworks', error)
    await recordAdminAuditLog({
      action: 'artworks.create',
      resource: 'artwork',
      session,
      request: req,
      status: 'error',
    })
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
