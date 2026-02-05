#!/usr/bin/env ts-node
/*
  Migrate local public/uploads images to Cloudinary.
  - Reads files from public/uploads
  - Uploads to Cloudinary with EXIF strip and f_auto/q_auto
  - Writes a JSON mapping file with { localPath, cloudUrl, publicId }

  Usage:
    CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... \
    npx ts-node scripts/migrate-uploads-to-cloudinary.ts

  Optional:
    CLOUDINARY_FOLDER=uploads
    DRY_RUN=1  (list files only)
*/
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

type Mapping = { localPath: string; publicId: string; url: string }

async function main(){
  const root = process.cwd()
  const uploadsDir = path.join(root, 'public', 'uploads')
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const folder = process.env.CLOUDINARY_FOLDER || 'uploads'
  const dry = process.env.DRY_RUN === '1'
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Missing Cloudinary env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
    process.exit(1)
  }
  try {
    await fsp.access(uploadsDir)
  } catch {
    console.error('No local uploads directory at', uploadsDir)
    process.exit(1)
  }
  const files = await fsp.readdir(uploadsDir)
  const imgs = files.filter(f=>/\.(png|jpe?g|gif|webp|svg)$/i.test(f))
  if (!imgs.length) {
    console.log('No images to migrate')
    return
  }
  console.log(`Found ${imgs.length} images to migrate`)
  const out: Mapping[] = []
  for (const f of imgs) {
    const full = path.join(uploadsDir, f)
    const stat = await fsp.stat(full)
    if (!stat.isFile()) continue
    console.log('Uploading', f)
    if (dry) { continue }
    const buf = await fsp.readFile(full)
    const timestamp = Math.floor(Date.now()/1000)
    const eager = 'c_fill,w_400,h_400,g_auto,f_auto,q_auto:good,fl_strip_profile|c_fill,w_800,h_800,g_auto,f_auto,q_auto:good,fl_strip_profile'
    const useFilename = 'true'
    const uniqueFilename = 'true'
    const toSign = [`eager=${eager}`, `folder=${folder}`, `timestamp=${timestamp}`, `unique_filename=${uniqueFilename}`, `use_filename=${useFilename}`].join('&')
    const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex')
    const form = new FormData()
    form.append('file', new Blob([buf]), f)
    form.append('api_key', apiKey)
    form.append('timestamp', String(timestamp))
    form.append('folder', folder)
    form.append('eager', eager)
    form.append('use_filename', useFilename)
    form.append('unique_filename', uniqueFilename)
    form.append('signature', signature)
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    const res = await fetch(endpoint, { method: 'POST', body: form as any })
    if (!res.ok) {
      const t = await res.text().catch(()=> '')
      console.error('Upload failed', res.status, t)
      continue
    }
    const data: any = await res.json()
    const publicId = data.public_id as string
    const version = data.version
    const format = data.format
    const base = `https://res.cloudinary.com/${cloudName}/image/upload`
    const mainTransf = 'c_limit,w_1600,f_auto,q_auto:good,fl_strip_profile'
    const url = `${base}/${mainTransf}/v${version}/${publicId}${format?'.'+format:''}`
    out.push({ localPath: `/uploads/${f}`, publicId, url })
  }
  if (!dry) {
    const target = path.join(root, 'scripts', 'migrate-uploads-mapping.json')
    await fsp.writeFile(target, JSON.stringify(out, null, 2), 'utf8')
    console.log('Wrote mapping to', target)
  }
}

main().catch((e)=>{ console.error(e); process.exit(1) })
