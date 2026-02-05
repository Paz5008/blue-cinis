#!/usr/bin/env ts-node
/*
  Replace local uploads URLs in DB by Cloudinary URLs using migration mapping.
  - Reads scripts/migrate-uploads-mapping.json
  - Updates fields: Artwork.imageUrl, Artist.photoUrl, Event.imageUrl, BlogPost.imageUrl
  - Also rewrites JSON contents in ProfileCustomization (content/draft/published) and ArtistPage (draft/published)

  Usage:
    # default: writes Cloudinary public URLs
    npx ts-node scripts/replace-uploads-urls.ts

    # write proxy URLs (/api/media/<publicId>), recommended if CLOUDINARY_AUTHENTICATED=true
    USE_PROXY=1 npx ts-node scripts/replace-uploads-urls.ts
*/
import path from 'path'
import fs from 'fs/promises'
import { prisma } from '../src/lib/prisma'

type MapItem = { localPath: string; publicId: string; url: string }

const USE_PROXY = process.env.USE_PROXY === '1' || process.env.CLOUDINARY_AUTHENTICATED === 'true'
const DRY_RUN = process.env.DRY_RUN === '1'

function mappedUrl(item: MapItem): string {
  if (USE_PROXY) return `/api/media/${encodeURIComponent(item.publicId)}`
  return item.url
}

async function loadMapping(): Promise<MapItem[]> {
  const p = path.join(process.cwd(), 'scripts', 'migrate-uploads-mapping.json')
  const buf = await fs.readFile(p, 'utf8')
  return JSON.parse(buf)
}

function matches(val: string | null | undefined, localPath: string): boolean {
  if (!val) return false
  if (val === localPath) return true
  try { if (val.includes(localPath)) return true } catch {}
  return false
}

function transformJson(obj: any, map: MapItem[]): any {
  if (obj == null) return obj
  if (typeof obj === 'string') {
    const found = map.find(it => obj.includes(it.localPath))
    return found ? obj.replace(found.localPath, mappedUrl(found)) : obj
  }
  if (Array.isArray(obj)) return obj.map(v => transformJson(v, map))
  if (typeof obj === 'object') {
    const out: any = {}
    for (const k of Object.keys(obj)) out[k] = transformJson(obj[k], map)
    return out
  }
  return obj
}

async function updateArtwork(map: MapItem[]) {
  const all = await prisma.artwork.findMany({ select: { id: true, imageUrl: true } })
  let updates = 0
  for (const a of all) {
    if (!a.imageUrl) continue
    const m = map.find(it => matches(a.imageUrl, it.localPath))
    if (m) {
      if (DRY_RUN) {
      console.log('[DRY] Artwork', a.id, '=>', mappedUrl(m))
    } else {
      await prisma.artwork.update({ where: { id: a.id }, data: { imageUrl: mappedUrl(m) } })
    }
      updates++
    }
  }
  console.log('Artwork updated:', updates)
}

async function updateArtist(map: MapItem[]) {
  const all = await prisma.artist.findMany({ select: { id: true, photoUrl: true } })
  let updates = 0
  for (const a of all) {
    if (!a.photoUrl) continue
    const m = map.find(it => matches(a.photoUrl!, it.localPath))
    if (m) {
      if (DRY_RUN) {
      console.log('[DRY] Artist', a.id, '=>', mappedUrl(m))
    } else {
      await prisma.artist.update({ where: { id: a.id }, data: { photoUrl: mappedUrl(m) } })
    }
      updates++
    }
  }
  console.log('Artist updated:', updates)
}

async function updateEvent(map: MapItem[]) {
  const all = await prisma.event.findMany({ select: { id: true, imageUrl: true } })
  let updates = 0
  for (const e of all) {
    if (!e.imageUrl) continue
    const m = map.find(it => matches(e.imageUrl!, it.localPath))
    if (m) {
      if (DRY_RUN) {
      console.log('[DRY] Event', e.id, '=>', mappedUrl(m))
    } else {
      await prisma.event.update({ where: { id: e.id }, data: { imageUrl: mappedUrl(m) } })
    }
      updates++
    }
  }
  console.log('Event updated:', updates)
}

async function updateBlog(map: MapItem[]) {
  const all = await prisma.blogPost.findMany({ select: { id: true, imageUrl: true } })
  let updates = 0
  for (const b of all) {
    if (!b.imageUrl) continue
    const m = map.find(it => matches(b.imageUrl!, it.localPath))
    if (m) {
      if (DRY_RUN) {
      console.log('[DRY] BlogPost', b.id, '=>', mappedUrl(m))
    } else {
      await prisma.blogPost.update({ where: { id: b.id }, data: { imageUrl: mappedUrl(m) } })
    }
      updates++
    }
  }
  console.log('BlogPost updated:', updates)
}

async function updateProfileCustomization(map: MapItem[]) {
  const all = await prisma.profileCustomization.findMany({ select: { id: true, content: true, draftContent: true, publishedContent: true } })
  let updates = 0
  for (const p of all) {
    const nextContent = transformJson(p.content as any, map)
    const nextDraft = transformJson(p.draftContent as any, map)
    const nextPublished = transformJson(p.publishedContent as any, map)
    const changed = JSON.stringify(nextContent) !== JSON.stringify(p.content) || JSON.stringify(nextDraft) !== JSON.stringify(p.draftContent) || JSON.stringify(nextPublished) !== JSON.stringify(p.publishedContent)
    if (changed) {
      if (DRY_RUN) {
      console.log('[DRY] ProfileCustomization', p.id)
    } else {
      await prisma.profileCustomization.update({ where: { id: p.id }, data: { content: nextContent, draftContent: nextDraft, publishedContent: nextPublished } })
    }
      updates++
    }
  }
  console.log('ProfileCustomization updated:', updates)
}

async function updateArtistPages(map: MapItem[]) {
  const all = await prisma.artistPage.findMany({ select: { id: true, draftContent: true, publishedContent: true } })
  let updates = 0
  for (const ap of all) {
    const nextDraft = transformJson(ap.draftContent as any, map)
    const nextPublished = transformJson(ap.publishedContent as any, map)
    const changed = JSON.stringify(nextDraft) !== JSON.stringify(ap.draftContent) || JSON.stringify(nextPublished) !== JSON.stringify(ap.publishedContent)
    if (changed) {
      if (DRY_RUN) {
      console.log('[DRY] ArtistPage', ap.id)
    } else {
      await prisma.artistPage.update({ where: { id: ap.id }, data: { draftContent: nextDraft, publishedContent: nextPublished } })
    }
      updates++
    }
  }
  console.log('ArtistPage updated:', updates)
}

async function main(){
  const mapping = await loadMapping()
  if (!Array.isArray(mapping) || mapping.length === 0) {
    console.error('No mapping found in scripts/migrate-uploads-mapping.json')
    process.exit(1)
  }
  await updateArtwork(mapping)
  await updateArtist(mapping)
  await updateEvent(mapping)
  await updateBlog(mapping)
  await updateProfileCustomization(mapping)
  await updateArtistPages(mapping)
  console.log('Done replacing URLs')
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1) })
