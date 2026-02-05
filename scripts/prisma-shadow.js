#!/usr/bin/env node
/**
 * Wraps prisma CLI ensuring SHADOW_DATABASE_URL is defined.
 */
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const dotenvPath = path.resolve(process.cwd(), '.env')

if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath })
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: prisma-shadow <prisma args…>')
  process.exit(1)
}

const FALLBACK_SCHEMA_NAME = process.env.SHADOW_DATABASE_SCHEMA || 'shadow_prisma'

function deriveShadowUrl() {
  const source = process.env.SHADOW_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!source) {
    return null
  }
  try {
    const url = new URL(source)
    const currentSchema = url.searchParams.get('schema')
    if (!currentSchema || currentSchema === 'public') {
      url.searchParams.set('schema', FALLBACK_SCHEMA_NAME)
    }
    return url.toString()
  } catch (error) {
    console.warn('[prisma-shadow] Impossible de parser l’URL de base pour générer SHADOW_DATABASE_URL.', error)
    return null
  }
}

const shadowUrl = deriveShadowUrl()
if (!shadowUrl) {
  console.error(
    '[prisma-shadow] Aucune SHADOW_DATABASE_URL disponible. Définissez SHADOW_DATABASE_URL ou DIRECT_URL/DATABASE_URL dans votre fichier .env.',
  )
  process.exit(1)
}

process.env.SHADOW_DATABASE_URL = shadowUrl

const prismaBin = path.resolve(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
)

const child = spawn(prismaBin, args, {
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
