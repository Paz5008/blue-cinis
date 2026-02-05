export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { z } from 'zod'
import { revalidateInventory } from '@/lib/revalidateInventory'

const priceOverrideSchema = z.union([z.literal(null), z.coerce.number().int().min(0)])

const updateVariantSchema = z.object({
  name: z.string().min(1).transform((v) => v.trim()).optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  priceOverride: priceOverrideSchema.optional(),
})

type AdminSession = Awaited<ReturnType<typeof ensureAdminSession>>

export async function PUT(req: NextRequest, { params }: { params: { id: string } }){
  let session: AdminSession = null
  try {
    session = await ensureAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const id = params.id
    const body = await req.json()
    const parsed = updateVariantSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'payload invalid' }, { status: 400 })
    const data: any = {}
    if (parsed.data.name) data.name = parsed.data.name
    if (typeof parsed.data.stockQuantity === 'number') data.stockQuantity = parsed.data.stockQuantity
    if (parsed.data.priceOverride !== undefined) data.priceOverride = parsed.data.priceOverride
    const variant = await prisma.variant.update({
      where: { id },
      data,
      select: { id: true, artworkId: true },
    })
    await revalidateInventory({ artworkIds: [variant.artworkId] })
    await recordAdminAuditLog({
      action: 'variants.update',
      resource: id,
      session,
      request: req,
      metadata: { updatedFields: Object.keys(data) },
    })
    return NextResponse.json({ ok: true })
  } catch {
    await recordAdminAuditLog({
      action: 'variants.update',
      resource: params.id,
      session,
      request: req,
      status: 'error',
    })
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }){
  let session: AdminSession = null
  try {
    session = await ensureAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const id = params.id
    const variant = await prisma.variant.delete({
      where: { id },
      select: { artworkId: true },
    })
    await revalidateInventory({ artworkIds: [variant.artworkId] })
    await recordAdminAuditLog({
      action: 'variants.delete',
      resource: id,
      session,
      request: req,
    })
    return NextResponse.json({ ok: true })
  } catch {
    await recordAdminAuditLog({
      action: 'variants.delete',
      resource: params.id,
      status: 'error',
      session,
      request: req,
    })
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
