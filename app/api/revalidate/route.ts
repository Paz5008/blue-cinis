import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const paths = Array.isArray(body?.paths) ? body.paths : []
    const tags = Array.isArray(body?.tags) ? body.tags : []
    for (const p of paths) {
      if (typeof p === 'string' && p.startsWith('/')) revalidatePath(p)
    }
    for (const t of tags) {
      if (typeof t === 'string' && t) revalidateTag(t)
    }
    return NextResponse.json({ ok: true, paths, tags })
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}
