import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    after: (callback?: () => unknown) => {
      if (typeof callback === 'function') {
        return callback()
      }
      return undefined
    },
  }
})

vi.mock('@/lib/adminGuard', () => ({ ensureAdminSession: vi.fn(async () => null) }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminExportJob: {
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
  },
}))
vi.mock('@/lib/audit', () => ({ recordAdminAuditLog: vi.fn(async () => undefined) }))
vi.mock('@/lib/exportStorage', () => ({
  persistAdminExportFile: vi.fn(async () => ({
    provider: 'file',
    key: 'job/export.csv',
    size: 128,
    checksum: 'deadbeef',
    url: null,
  })),
}))

async function getHandler() {
  const mod = await import('../app/api/admin/orders/export/route')
  return mod.POST
}

function makeReq(body: unknown = {}) {
  return {
    headers: new Headers(),
    json: async () => body,
  } as any
}

describe('POST /api/admin/orders/export', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { ensureAdminSession } = await import('@/lib/adminGuard')
    ensureAdminSession.mockResolvedValue(null)
  })

  it('returns 403 if admin session is missing', async () => {
    const POST = await getHandler()
    const res = await POST(makeReq())
    expect(res.status).toBe(403)
  })

  it('creates an async export job and runs it inline during tests', async () => {
    const now = new Date('2024-01-02T00:00:00Z')
    const baseJob = {
      id: 'job_1',
      type: 'orders_csv',
      status: 'pending',
      filters: {},
      triggeredById: 'admin1',
      triggeredByEmail: 'admin@example.com',
      fileName: null,
      fileMimeType: null,
      fileSize: null,
      fileChecksum: null,
      fileStorageProvider: null,
      fileStorageKey: null,
      fileStorageUrl: null,
      errorMessage: null,
      readyAt: null,
      createdAt: now,
      updatedAt: now,
    }

    const { ensureAdminSession } = await import('@/lib/adminGuard')
    ensureAdminSession.mockResolvedValue({ user: { id: 'admin1', email: 'admin@example.com', role: 'admin' } })

    const { prisma } = await import('@/lib/prisma')
    prisma.adminExportJob.create.mockResolvedValue({ ...baseJob })
    prisma.adminExportJob.update.mockImplementation(async ({ data }: any) => {
      Object.assign(baseJob, data, { updatedAt: now })
      if ('readyAt' in data && data.readyAt instanceof Date) {
        baseJob.readyAt = data.readyAt
      }
      return { ...baseJob }
    })
    prisma.order.findMany.mockResolvedValueOnce([])

    const POST = await getHandler()
    const res = await POST(makeReq({ filters: { status: 'paid' } }))
    expect(res.status).toBe(200)

    const payload = await res.json()
    expect(payload.job).toMatchObject({
      id: 'job_1',
      type: 'orders_csv',
      status: 'pending',
      readyAt: null,
    })

    expect(prisma.adminExportJob.create).toHaveBeenCalledTimes(1)
    expect(prisma.adminExportJob.update).toHaveBeenCalledWith({
      where: { id: 'job_1' },
      data: { status: 'processing' },
    })
    expect(prisma.adminExportJob.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'job_1' },
      data: expect.objectContaining({ status: 'ready' }),
    }))
    expect(prisma.order.findMany).toHaveBeenCalledTimes(1)
  })
})
