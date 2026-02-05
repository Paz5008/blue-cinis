#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'

const prisma = new PrismaClient()

function makeSlug(s: string, suffix?: string) {
  let base = slugify(s || '', { lower: true, strict: true }) || 'item'
  if (suffix) base += '-' + suffix
  return base
}

async function uniqueSlug(table: 'artist'|'artwork'|'category'|'blogPost', title: string) {
  let slug = makeSlug(title)
  for (let i=2; i<1000; i++) {
    const exists = await prisma.$queryRawUnsafe<any[]>(`SELECT 1 FROM "${table[0].toUpperCase()+table.slice(1)}" WHERE slug = $1 LIMIT 1`, slug)
    if (!exists || exists.length === 0) return slug
    slug = makeSlug(title, String(i))
  }
  return makeSlug(title, String(Date.now()))
}

async function run() {
  // Ensure currency on artworks
  await prisma.$executeRawUnsafe(`UPDATE "Artwork" SET currency = 'EUR' WHERE currency IS NULL OR currency = ''`)

  // Backfill artist slugs
  const artists = await prisma.artist.findMany({ select: { id: true, slug: true, name: true } })
  for (const a of artists) {
    if (!a.slug) {
      const slug = await uniqueSlug('artist', a.name || 'artist')
      await prisma.artist.update({ where: { id: a.id }, data: { slug } })
    }
  }

  // Backfill artwork slugs
  const artworks = await prisma.artwork.findMany({ select: { id: true, slug: true, title: true } })
  for (const aw of artworks) {
    if (!aw.slug) {
      const slug = await uniqueSlug('artwork', aw.title || 'artwork')
      await prisma.artwork.update({ where: { id: aw.id }, data: { slug } })
    }
  }

  // Backfill category slugs
  const categories = await prisma.category.findMany({ select: { id: true, slug: true, name: true } })
  for (const c of categories) {
    if (!c.slug) {
      const slug = await uniqueSlug('category', c.name || 'category')
      await prisma.category.update({ where: { id: c.id }, data: { slug } })
    }
  }

  // Backfill blogpost slugs
  const posts = await prisma.blogPost.findMany({ select: { id: true, slug: true, title: true } })
  for (const p of posts) {
    if (!p.slug) {
      const slug = await uniqueSlug('blogPost', p.title || 'post')
      await prisma.blogPost.update({ where: { id: p.id }, data: { slug } })
    }
  }

  console.log('Migration v2 backfill completed.')
}

run().catch((e)=>{ console.error(e); process.exit(1)}).finally(()=> prisma.$disconnect())
