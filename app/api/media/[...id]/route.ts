export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'

export async function GET(req: NextRequest, { params }: { params: { id: string[] } }) {
  const idParts = params.id || []
  if (!(cloudinary as any).config().cloud_name) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 })
  }
  const publicId = decodeURIComponent(idParts.join('/'))
  const url = new URL(req.url)
  const w = parseInt(url.searchParams.get('w') || '') || undefined
  const h = parseInt(url.searchParams.get('h') || '') || undefined
  const fit = url.searchParams.get('fit') || undefined
  const ttl = parseInt(process.env.CLOUDINARY_SIGNED_TTL || '300')
  const expireAt = Math.floor(Date.now()/1000) + Math.max(60, ttl)

  const transformation: any[] = []
  if (w || h || fit) {
    const t: any = { fetch_format: 'auto', quality: 'auto:good', flags: 'strip_profile' }
    if (w) t.width = w
    if (h) t.height = h
    if (fit === 'fill') { t.crop = 'fill'; t.gravity = 'auto' } else { t.crop = 'limit' }
    transformation.push(t)
  } else {
    transformation.push({ crop: 'limit', width: 1600, fetch_format: 'auto', quality: 'auto:good', flags: 'strip_profile' })
  }

  const signedUrl = (cloudinary as any).url(publicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expire_at: expireAt,
    transformation,
    resource_type: 'image',
  })
  return NextResponse.redirect(signedUrl, { status: 302 })
}

export const dynamic = 'force-dynamic'
