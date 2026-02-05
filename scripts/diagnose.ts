#!/usr/bin/env ts-node
/* Quick project health diagnostics */
import { prisma } from '../src/lib/prisma'
import { cloudinary } from '../src/lib/cloudinary'
import Stripe from 'stripe'

async function main(){
  const out: any = {}
  // DB
  try { await prisma.$queryRaw`SELECT 1`; out.db = 'ok' } catch(e:any){ out.db = `error: ${e?.message||e}` }
  // Cloudinary
  try {
    const cfg = (cloudinary as any).config?.()
    if (cfg?.cloud_name) out.cloudinary = `ok (${cfg.cloud_name})`
    else out.cloudinary = 'not_configured'
  } catch(e:any){ out.cloudinary = `error: ${e?.message||e}` }
  // Stripe
  const sk = process.env.STRIPE_SECRET_KEY
  if (!sk) out.stripe = 'not_configured'
  else {
    try { const s = new Stripe(sk, { apiVersion: '2024-06-20' }); await s.accounts.retrieve(); out.stripe = 'ok' } catch(e:any){ out.stripe = `error: ${e?.message||e}` }
  }
  console.log(JSON.stringify(out, null, 2))
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1) })
