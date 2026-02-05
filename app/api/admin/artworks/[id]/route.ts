import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { validateMfaToken, describeMfaFailure } from '@/lib/mfa'
import { z } from 'zod'
import { ADMIN_ARTWORK_DETAIL_SELECT } from '@/lib/adminArtworks'
import { revalidateInventory } from '@/lib/revalidateInventory'

function isPrismaNotFoundError(error: unknown): error is { code: 'P2025' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2025'
  )
}

const updateArtworkSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2)
      .max(255)
      .optional(),
    artistId: z
      .string()
      .trim()
      .min(1)
      .optional(),
    price: z
      .number()
      .int()
      .min(0)
      .optional(),
    imageUrl: z
      .union([z.string().trim().max(2048), z.literal(null)])
      .optional(),
    description: z
      .union([z.string().trim().max(4000), z.literal(null)])
      .optional(),
    dimensions: z
      .union([z.string().trim().max(255), z.literal(null)])
      .optional(),
    year: z
      .union([z.number().int().min(1000).max(9999), z.literal(null)])
      .optional(),
    stockQuantity: z
      .union([z.number().int().min(0).max(10_000), z.literal(null)])
      .optional(),
    isAvailable: z.boolean().optional(),
    categoryId: z
      .union([z.string().trim().min(1), z.literal(null)])
      .optional(),
  })
  .strict()

function normalizeArtworkPayload(payload: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...payload }

  const nullableFields = ['imageUrl', 'description', 'dimensions', 'categoryId'] as const
  for (const field of nullableFields) {
    if (field in normalized) {
      const value = normalized[field]
      if (typeof value === 'string') {
        const trimmed = value.trim()
        normalized[field] = trimmed.length ? trimmed : null
      } else if (value === null) {
        normalized[field] = null
      }
    }
  }

  if (typeof normalized.title === 'string') {
    normalized.title = normalized.title.trim()
  }
  if (typeof normalized.artistId === 'string') {
    normalized.artistId = normalized.artistId.trim()
  }
  return normalized
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const id = params.id
  const art = await prisma.artwork.findUnique({ where: { id }, select: ADMIN_ARTWORK_DETAIL_SELECT })
  if (!art) {
    await recordAdminAuditLog({
      action: 'artworks.detail',
      resource: id,
      session,
      request: req,
      status: 'denied',
      metadata: { reason: 'not_found' },
    })
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  await recordAdminAuditLog({
    action: 'artworks.detail',
    resource: id,
    session,
    request: req,
  })
  return NextResponse.json(art)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const payload = await req.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }
    const normalized = normalizeArtworkPayload(payload as Record<string, unknown>)
    const parsed = updateArtworkSchema.safeParse(normalized)
    if (!parsed.success) {
      await recordAdminAuditLog({
        action: 'artworks.update',
        resource: params.id,
        session,
        request: req,
        status: 'denied',
        metadata: { reason: 'invalid_payload', issues: parsed.error.flatten() },
      })
      return NextResponse.json({ error: 'Champs invalides', details: parsed.error.flatten() }, { status: 400 })
    }
    const updates = Object.entries(parsed.data).filter(([, value]) => value !== undefined)
    if (updates.length === 0) {
      return NextResponse.json({ error: 'Aucun champ fourni' }, { status: 400 })
    }

    const updateData: Prisma.ArtworkUncheckedUpdateInput = {}
    let resolvedArtistId: string | undefined

    if (parsed.data.title !== undefined) {
      updateData.title = parsed.data.title
    }
    if (parsed.data.price !== undefined) {
      updateData.price = parsed.data.price
    }
    if (parsed.data.imageUrl !== undefined) {
      ; (updateData as any).imageUrl = parsed.data.imageUrl
    }
    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description
    }
    if (parsed.data.dimensions !== undefined) {
      updateData.dimensions = parsed.data.dimensions ?? Prisma.DbNull
    }
    if (parsed.data.year !== undefined) {
      updateData.year = parsed.data.year
    }
    if (parsed.data.stockQuantity !== undefined) {
      updateData.stockQuantity = parsed.data.stockQuantity
    }
    if (parsed.data.isAvailable !== undefined) {
      (updateData as any).status = parsed.data.isAvailable ? 'available' : 'sold'
    }
    if (parsed.data.categoryId !== undefined) {
      ; (updateData as any).categoryId = parsed.data.categoryId
    }
    if (parsed.data.artistId !== undefined) {
      resolvedArtistId = parsed.data.artistId
      const artist = await prisma.artist.findUnique({
        where: { id: resolvedArtistId },
        select: { id: true, name: true },
      })
      if (!artist) {
        return NextResponse.json({ error: 'Artiste introuvable' }, { status: 400 })
      }
      updateData.artistId = artist.id
      updateData.artistName = artist.name
    }

    const updated = await prisma.artwork.update({
      where: { id: params.id },
      data: updateData,
      select: ADMIN_ARTWORK_DETAIL_SELECT,
    })

    await revalidateInventory({ artworkIds: [params.id] })
    await recordAdminAuditLog({
      action: 'artworks.update',
      resource: params.id,
      session,
      request: req,
      metadata: { fields: updates.map(([key]) => key) },
    })
    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      await recordAdminAuditLog({
        action: 'artworks.update',
        resource: params.id,
        session,
        request: req,
        status: 'denied',
        metadata: { reason: 'not_found' },
      })
      return NextResponse.json({ error: 'Œuvre introuvable' }, { status: 404 })
    }
    console.error('Erreur PUT /api/admin/artworks/[id]', error)
    await recordAdminAuditLog({
      action: 'artworks.update',
      resource: params.id,
      session,
      request: req,
      status: 'error',
    })
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const mfaResult = await validateMfaToken({
    token: req.headers.get('x-admin-mfa-token'),
    userId: session.user?.id || null,
    scope: 'artworks.delete',
  })
  if (!mfaResult.ok) {
    await recordAdminAuditLog({
      action: 'artworks.delete',
      resource: params.id,
      session,
      request: req,
      status: 'denied',
      metadata: { reason: 'mfa_failed', detail: mfaResult.reason },
    })
    return NextResponse.json({ error: describeMfaFailure(mfaResult.reason) }, { status: 412 })
  }
  const id = params.id
  try {
    const existing = await prisma.artwork.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      await recordAdminAuditLog({
        action: 'artworks.delete',
        resource: id,
        session,
        request: req,
        status: 'denied',
        metadata: { reason: 'not_found' },
      })
      return NextResponse.json({ error: 'Œuvre introuvable' }, { status: 404 })
    }
    await prisma.artwork.delete({ where: { id } })
    await revalidateInventory({ artworkIds: [id] })
    await recordAdminAuditLog({
      action: 'artworks.delete',
      resource: id,
      session,
      request: req,
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/artworks/[id]', error)
    await recordAdminAuditLog({
      action: 'artworks.delete',
      resource: id,
      session,
      request: req,
      status: 'error',
    })
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
