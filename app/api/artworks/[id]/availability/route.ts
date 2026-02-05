export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const art = await prisma.artwork.findUnique({ where: { id }, select: { stockQuantity: true } })
    if (!art) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const now = new Date()
    const reserved = await prisma.reservation.count({ where: { artworkId: id, status: 'active', expiresAt: { gt: now } } })
    const stock = typeof art.stockQuantity === 'number' ? art.stockQuantity : 1
    const available = Math.max(0, stock - reserved)
    return NextResponse.json({ stock, reserved, available }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
