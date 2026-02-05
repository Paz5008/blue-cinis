export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { z } from 'zod'
import { revalidateInventory } from '@/lib/revalidateInventory'

const priceOverrideSchema = z.union([z.literal(null), z.coerce.number().int().min(0)])

const createVariantSchema = z.object({
  name: z.string().min(1).transform((v) => v.trim()),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  priceOverride: priceOverrideSchema.optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }){
  try {
    const id = params.id
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope')
    const isAdminScope = scope === 'admin'
    const session = isAdminScope ? await ensureAdminSession() : null
    if (isAdminScope && !session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const variants = await prisma.variant.findMany({ where: { artworkId: id }, orderBy: { createdAt: 'asc' } })
    const reservations = await prisma.reservation.groupBy({
      by: ['variantId'],
      where: {
        artworkId: id,
        status: 'active',
        expiresAt: { gt: new Date() },
        variantId: { not: null },
      },
      _sum: { quantity: true },
    })
    const reservedMap = new Map<string, number>()
    for (const entry of reservations) {
      if (entry.variantId) {
        reservedMap.set(entry.variantId, entry._sum.quantity ?? 0)
      }
    }
    const out = variants.map((variant) => {
      const stock = typeof variant.stockQuantity === 'number' ? variant.stockQuantity : 1
      const reserved = reservedMap.get(variant.id) ?? 0
      const base = {
        id: variant.id,
        name: variant.name,
        priceOverride: variant.priceOverride,
        available: Math.max(0, stock - reserved),
      }
      if (isAdminScope) {
        return { ...base, stockQuantity: variant.stockQuantity, reserved }
      }
      return base
    })
    if (isAdminScope && session) {
      await recordAdminAuditLog({
        action: 'variants.list',
        resource: `artwork:${id}`,
        session,
        request: req,
        metadata: { count: out.length },
      })
    }
    return NextResponse.json(out, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }){
  try {
    const session = await ensureAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const id = params.id
    const body = await req.json()
    const parsed = createVariantSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'payload invalid' }, { status: 400 })
    const stockQuantity = parsed.data.stockQuantity ?? 1
    const priceOverride = typeof parsed.data.priceOverride === 'number' ? parsed.data.priceOverride : null
    if (!parsed.data.name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const v = await prisma.variant.create({ data: { artworkId: id, name: parsed.data.name, stockQuantity, priceOverride } })
    await revalidateInventory({ artworkIds: [id] })
    await recordAdminAuditLog({
      action: 'variants.create',
      resource: `artwork:${id}`,
      session,
      request: req,
      metadata: { variantId: v.id },
    })
    return NextResponse.json({ id: v.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
