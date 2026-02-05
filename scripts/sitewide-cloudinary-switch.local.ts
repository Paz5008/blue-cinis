#!/usr/bin/env ts-node
/*
 Local end-to-end Cloudinary switch helper (no GitHub Actions required)
 - Ensures Prisma migrations are applied
 - Migrates local public/uploads to Cloudinary
 - Shows a dry-run DB rewrite
 - Optionally performs full switch (UPDATE_ENV=1) to /api/media proxy URLs

Usage:
  ts-node scripts/sitewide-cloudinary-switch.local.ts --mode=full   # full switch
  ts-node scripts/sitewide-cloudinary-switch.local.ts --mode=dry    # migrate + dry-run only
  ts-node scripts/sitewide-cloudinary-switch.local.ts --mode=migrate_only
*/
import { execSync } from 'child_process'

function run(cmd: string, env: Record<string,string|undefined> = process.env){
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', env })
}

function getArg(name: string, def?: string){
  const m = process.argv.find(a => a.startsWith(`--${name}=`))
  return m ? m.split('=').slice(1).join('=') : def
}

async function main(){
  const mode = getArg('mode','full') // full | dry | migrate_only
  console.log(`[switch] mode=${mode}`)

  // 1) Prisma migrations
  run('npx prisma migrate deploy')

  // 2) Migrate local uploads to Cloudinary (optional but recommended)
  if (mode !== 'dry' || mode === 'full' || mode === 'migrate_only'){
    try { run('npm run media:migrate') } catch {}
  }

  // 3) Show a dry-run of DB rewrite
  try { run('npm run media:rewrite:dry') } catch {}

  // 4) Full switch
  if (mode === 'full'){
    const env = { ...process.env, UPDATE_ENV: '1' }
    run('npm run media:switch', env)
  }

  console.log('\n[done] Switch helper finished')
}

main().catch((e)=>{ console.error(e); process.exit(1) })
