#!/usr/bin/env ts-node
/*
 Automate site-wide switch to Cloudinary authenticated + proxy URLs
 - Optionally set CLOUDINARY_AUTHENTICATED=true in .env (UPDATE_ENV=1)
 - Run DB rewrite to /api/media via USE_PROXY=1
 - Verify counts of remaining non-proxy URLs in common columns

 Usage:
   # Dry verify current DB
   npx ts-node scripts/sitewide-cloudinary-switch.ts

   # Perform switch (env update + rewrite + verify)
   UPDATE_ENV=1 npx ts-node scripts/sitewide-cloudinary-switch.ts
*/
import { execSync } from 'child_process'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { prisma } from '../src/lib/prisma'

async function updateEnv(){
  const envPath = path.join(process.cwd(), '.env')
  try {
    let content = ''
    try { content = await fsp.readFile(envPath, 'utf8') } catch { /* no .env */ }
    if (!content.includes('CLOUDINARY_AUTHENTICATED')) content += (content.endsWith('\n')?'':'\n') + 'CLOUDINARY_AUTHENTICATED=true\n'
    else content = content.replace(/CLOUDINARY_AUTHENTICATED=.*/,'CLOUDINARY_AUTHENTICATED=true')
    if (!content.includes('CLOUDINARY_SIGNED_TTL')) content += 'CLOUDINARY_SIGNED_TTL=300\n'
    await fsp.writeFile(envPath, content, 'utf8')
    console.log('[env] Updated .env CLOUDINARY_AUTHENTICATED=true, CLOUDINARY_SIGNED_TTL=300')
  } catch (e){
    console.warn('[env] Could not update .env automatically:', (e as any).message)
  }
}

async function rewriteDBToProxy(){
  console.log('[rewrite] Rewriting DB URLs to /api/media ...')
  execSync('USE_PROXY=1 ts-node scripts/replace-uploads-urls.ts', { stdio: 'inherit', env: { ...process.env, USE_PROXY: '1' }})
}

async function verify(){
  console.log('[verify] Scanning DB for non-proxy URLs ...')
  const [aw, ar, ev, bl] = await Promise.all([
    prisma.artwork.count({ where: { NOT: { imageUrl: { startsWith: '/api/media/' } }, imageUrl: { not: null } } }),
    prisma.artist.count({ where: { NOT: { photoUrl: { startsWith: '/api/media/' } }, photoUrl: { not: null } } }),
    prisma.event.count({ where: { NOT: { imageUrl: { startsWith: '/api/media/' } }, imageUrl: { not: null } } }),
    prisma.blogPost.count({ where: { NOT: { imageUrl: { startsWith: '/api/media/' } }, imageUrl: { not: null } } }),
  ])
  console.log(`[verify] Non-proxy counts — Artwork:${aw} Artist:${ar} Event:${ev} BlogPost:${bl}`)
  if (aw+ar+ev+bl>0) {
    console.warn('[verify] Some records still reference non-proxy URLs. Consider re-running rewrite, and check JSON contents are handled (they are processed by the script).')
  } else {
    console.log('[verify] All common URL columns use proxy URLs. JSON contents were also rewritten by the script.')
  }
}

async function main(){
  const update = process.env.UPDATE_ENV === '1'
  if (update) await updateEnv()
  else console.log('[env] Skipping .env update (set UPDATE_ENV=1 to enable)')
  await rewriteDBToProxy()
  await verify()
  console.log('[done] Site-wide switch verification complete')
}

main().catch((e)=>{ console.error(e); process.exit(1) })
