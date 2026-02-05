import { describe, it, expect, vi, beforeEach } from 'vitest'

const ensureAdminSession = vi.hoisted(() => vi.fn(async () => null))
const revalidateTag = vi.hoisted(() => vi.fn(async () => undefined))
const revalidatePath = vi.hoisted(() => vi.fn(async () => undefined))
const recordAdminAuditLog = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('@/lib/adminGuard', () => ({
  ensureAdminSession: ensureAdminSession,
}))

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTag,
  revalidatePath: revalidatePath,
}))

vi.mock('@/lib/audit', () => ({
  recordAdminAuditLog: recordAdminAuditLog,
}))

async function getModule() {
  vi.resetModules()
  return await import('../app/api/admin/maintenance/revalidate/route')
}

const makeRequest = (body: Record<string, unknown>) =>
  ({
    headers: new Headers(),
    async json() {
      return body
    },
  }) as any

describe('API /api/admin/maintenance/revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ensureAdminSession.mockResolvedValue({ user: { id: 'admin', email: 'ops@example.com' } })
  })

  describe('GET', () => {
    it('returns 403 when session is missing', async () => {
      ensureAdminSession.mockResolvedValueOnce(null)
      const { GET } = await getModule()
      const res = await GET()
      expect(res.status).toBe(403)
    })

    it('returns available scripts with targets', async () => {
      const { GET } = await getModule()
      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json.scripts)).toBe(true)
      const artistsScript = json.scripts.find((s: any) => s.id === 'artists-refresh')
      expect(artistsScript.tags).toContain('artists')
      expect(artistsScript.paths).toContain('/')
    })
  })

  describe('POST', () => {
    it('returns 403 when session is missing', async () => {
      ensureAdminSession.mockResolvedValueOnce(null)
      const { POST } = await getModule()
      const res = await POST(makeRequest({ scriptId: 'artists-refresh' }))
      expect(res.status).toBe(403)
    })

    it('returns 400 for invalid script id', async () => {
      const { POST } = await getModule()
      const res = await POST(makeRequest({ scriptId: 'unknown' }))
      expect(res.status).toBe(400)
    })

    it('revalidates tags and paths then records audit log on success', async () => {
      const { POST } = await getModule()
      const res = await POST(makeRequest({ scriptId: 'artists-refresh' }))
      expect(res.status).toBe(200)
      expect(revalidateTag.mock.calls.length).toBeGreaterThan(0)
      expect(revalidatePath.mock.calls.length).toBeGreaterThan(0)
      expect(recordAdminAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'cache.revalidate.script',
          resource: 'artists-refresh',
          metadata: expect.objectContaining({
            tags: expect.any(Array),
            paths: expect.any(Array),
          }),
        }),
      )
      const body = await res.json()
      expect(body.tags.length).toBeGreaterThan(0)
      expect(body.paths.length).toBeGreaterThan(0)
    })

    it('logs error and returns 500 when revalidation fails', async () => {
      revalidateTag.mockImplementationOnce(() => {
        throw new Error('fails')
      })
      const { POST } = await getModule()
      const res = await POST(makeRequest({ scriptId: 'artists-refresh' }))
      expect(res.status).toBe(500)
      expect(recordAdminAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          action: 'cache.revalidate.script',
        }),
      )
    })
  })
})
