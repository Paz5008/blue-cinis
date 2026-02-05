
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import sharp from 'sharp'
import { env } from '@/env'

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

function isAllowedMime(mime: string) {
  return ALLOWED_MIME_TYPES.has(mime.toLowerCase());
}

export function getCloudinaryConfig() {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET
  const folder = env.CLOUDINARY_FOLDER || 'uploads'
  if (cloudName && apiKey && apiSecret && !cloudName.includes('demo')) return { cloudName, apiKey, apiSecret, folder }
  return null
}

export async function uploadImageFile(file: File): Promise<{ url: string; thumbs?: string[]; publicId?: string; width?: number; height?: number; sizeKb?: number; mimeType?: string }> {
  try {
    // 10MB limit (Technical sanity)
    const MAX_SIZE = 10 * 1024 * 1024
    if (!file || file.size === 0) throw new Error('No file')
    if (file.size > MAX_SIZE) throw new Error('too_large')

    const mimeRaw = (file as any).type || ''
    const mime = mimeRaw.toLowerCase()
    if (!isAllowedMime(mime)) throw new Error('invalid_type')

    const cloud = getCloudinaryConfig()
    await fs.writeFile('upload_debug.log', `Cloud Config: ${JSON.stringify(cloud)}\n`, { flag: 'a' }).catch(() => { });

    const mustUseCloudinary = env.NODE_ENV === 'production'

    // Cloudinary Handling
    if (cloud) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const timestamp = Math.floor(Date.now() / 1000)
      // Eager transforms for thumbnails
      const eager = 'c_fill,w_400,h_400,g_auto,f_auto,q_auto:good,fl_strip_profile|c_fill,w_800,h_800,g_auto,f_auto,q_auto:good,fl_strip_profile'
      const useFilename = 'true'
      const uniqueFilename = 'true'

      // Sign request
      const toSign = [`eager=${eager}`, `folder=${cloud.folder}`, `timestamp=${timestamp}`, `unique_filename=${uniqueFilename}`, `use_filename=${useFilename}`].join('&')
      const signature = crypto.createHash('sha1').update(toSign + cloud.apiSecret).digest('hex')

      // Convert buffer to blob for FormData
      const form = new FormData()
      form.append('file', new Blob([buffer], { type: mime }), (file as any).name)
      form.append('api_key', cloud.apiKey)
      form.append('timestamp', String(timestamp))
      form.append('folder', cloud.folder)
      form.append('eager', eager)
      form.append('use_filename', useFilename)
      form.append('unique_filename', uniqueFilename)
      form.append('signature', signature)

      const endpoint = `https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/upload`
      const res = await fetch(endpoint, { method: 'POST', body: form as any })
      if (!res.ok) throw new Error('cloud_fail')

      const data: any = await res.json()
      const publicId: string = data.public_id
      const version: string | number = data.version
      const format: string | undefined = data.format

      const width = data.width;
      const height = data.height;
      const sizeKb = Math.round((data.bytes || 0) / 1024);

      const base = `https://res.cloudinary.com/${cloud.cloudName}/image/upload`

      // Optimization: Resize to 2500px if larger (User Requirement), webp auto
      const mainTransf = 'c_limit,w_2500,f_auto,q_auto:good,fl_strip_profile'

      const url = `${base}/${mainTransf}/v${version}/${publicId}${format ? '.' + format : ''}`
      const thumbs = [400, 800].map(size => `${base}/c_fill,w_${size},h_${size},g_auto,f_auto,q_auto:good,fl_strip_profile/v${version}/${publicId}${format ? '.' + format : ''}`)

      return { url, thumbs, publicId, width, height, sizeKb, mimeType: `image/${format}` }
    }

    // Fallback / Local Handling
    if (mustUseCloudinary) {
      throw new Error('cloudinary_required')
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    let finalBuffer = buffer
    let extension = ((): string => {
      if (mime === 'image/png') return '.png'
      if (mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/pjpeg') return '.jpg'
      if (mime === 'image/webp') return '.webp'
      if (mime === 'image/gif') return '.gif'
      if (mime === 'image/svg+xml') return '.svg'
      return '.img'
    })()

    let width: number | undefined;
    let height: number | undefined;

    // Optimization using Sharp (Skip for GIF/SVG to avoid breaking animation/vector)
    if (mime !== 'image/gif' && mime !== 'image/svg+xml') {
      try {
        const instance = sharp(buffer).rotate() // Auto-rotate based on EXIF
        const metadata = await instance.metadata()
        width = metadata.width;
        height = metadata.height;

        // Rule: If > 4000px, resize to 2500px logic
        if (metadata.width && metadata.width > 4000) {
          instance.resize(2500, null, { withoutEnlargement: true }) // Maintain aspect ratio
        }

        // Rule: Convert to WebP (Gain ~30% size)
        const optimized = await instance.webp({ quality: 85 }).toBuffer()

        finalBuffer = Buffer.from(optimized)
        extension = '.webp'

        // Update dimensions if resized? Sharp metadata is pre-resize. 
        // Logic: if resized, width becomes 2500 max.
        if (width && width > 4000) {
          const ratio = (metadata.height || 1) / width;
          width = 2500;
          height = Math.round(2500 * ratio);
        }
      } catch (err) {
        console.warn('sharp optimization failed, keeping original buffer', err)
        await fs.writeFile('upload_debug.log', `Sharp Error: ${err}\n`, { flag: 'a' }).catch(() => { });
      }
    }

    const fileName = `${crypto.randomUUID()}${extension}`
    const filePath = path.join(uploadsDir, fileName)
    await fs.writeFile(filePath, finalBuffer)

    const sizeKb = Math.round(finalBuffer.byteLength / 1024);

    return { url: `/uploads/${fileName}`, width, height, sizeKb, mimeType: extension === '.webp' ? 'image/webp' : mime }
  } catch (err: any) {
    await fs.writeFile('upload_debug.log', `Upload Failed: ${err?.message || err}\nStack: ${err?.stack || ''}\n`, { flag: 'a' }).catch(() => { });
    throw err;
  }
}
