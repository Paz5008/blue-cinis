'use server'

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { env } from '@/env'
import { cloudinary } from '@/lib/cloudinary'
import { logger } from '@/lib/logger'

type PersistParams = {
  jobId: string
  fileName: string
  mimeType: string
  buffer: Buffer
}

type StorageRecordBase = {
  provider: string
  key: string
  size: number
  url?: string | null
}

export type StoredExportRecord = StorageRecordBase & {
  checksum: string
}

const storageRoot = path.join(process.cwd(), 'tmp', 'admin-exports')

function sanitizeFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function hasCloudinaryConfig() {
  const cfg = (cloudinary as any)?.config?.()
  return Boolean(cfg?.cloud_name)
}

function resolveProvider(): 'cloudinary' | 'file' {
  const requested = (env.ADMIN_EXPORT_STORAGE_PROVIDER || '').toLowerCase()
  if (requested === 'cloudinary' && hasCloudinaryConfig()) return 'cloudinary'
  if (requested === 'file' || requested === 'filesystem') return 'file'
  return hasCloudinaryConfig() ? 'cloudinary' : 'file'
}

async function persistWithCloudinary(params: PersistParams): Promise<StorageRecordBase> {
  const cfg = (cloudinary as any)?.config?.()
  if (!cfg?.cloud_name) {
    throw new Error('Cloudinary non configuré pour les exports')
  }
  const folderBase = env.CLOUDINARY_FOLDER ? `${env.CLOUDINARY_FOLDER}/exports` : 'admin_exports'
  const safeName = sanitizeFileName(params.fileName || 'export.csv')
  const publicId = `${folderBase}/${params.jobId}-${Date.now()}-${safeName}`.replace(/\/+/g, '/')
  const payload = `data:${params.mimeType};base64,${params.buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(payload, {
    public_id: publicId,
    resource_type: 'raw',
    overwrite: true,
  })
  return {
    provider: 'cloudinary',
    key: result.public_id,
    size: typeof result.bytes === 'number' ? result.bytes : params.buffer.length,
    url: result.secure_url || result.url || null,
  }
}

async function persistWithFilesystem(params: PersistParams): Promise<StorageRecordBase> {
  const safeName = sanitizeFileName(params.fileName || 'export.csv')
  const key = `${params.jobId}/${Date.now()}-${safeName}`
  const destination = path.join(storageRoot, ...key.split('/'))
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.writeFile(destination, params.buffer)
  return { provider: 'file', key, size: params.buffer.length, url: null }
}

export async function persistAdminExportFile(params: PersistParams): Promise<StoredExportRecord> {
  const checksum = crypto.createHash('sha256').update(params.buffer).digest('hex')
  const provider = resolveProvider()
  try {
    const base =
      provider === 'cloudinary'
        ? await persistWithCloudinary(params)
        : await persistWithFilesystem(params)
    return { ...base, checksum }
  } catch (error) {
    logger.error({ err: error }, '[exportStorage] persist failed, falling back to filesystem')
    const base = await persistWithFilesystem(params)
    return { ...base, checksum }
  }
}

export async function readAdminExportFile(record: {
  provider?: string | null
  key?: string | null
  url?: string | null
}): Promise<Buffer> {
  if (!record.provider || !record.key) {
    throw new Error('Export storage record incomplet')
  }
  if (record.provider === 'cloudinary') {
    const directUrl =
      record.url ||
      (cloudinary as any).url(record.key, {
        resource_type: 'raw',
        secure: true,
        sign_url: false,
      })
    const res = await fetch(directUrl)
    if (!res.ok) {
      throw new Error(`Export Cloudinary introuvable (${res.status})`)
    }
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
  if (record.provider === 'file') {
    const filePath = path.join(storageRoot, ...record.key.split('/'))
    return fs.readFile(filePath)
  }
  throw new Error(`Fournisseur de stockage export non supporté: ${record.provider}`)
}
