import { describe, it, expect, vi, beforeEach } from 'vitest'

const uploadImageFile = vi.hoisted(() => vi.fn(async () => ({ url: 'https://cdn.example.com/new.png' })))

// Mock @/auth since routes use auth() from @/auth
vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    artist: { findUnique: vi.fn(), create: vi.fn() },
    artwork: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))
vi.mock('@/lib/uploads', () => ({
  uploadImageFile,
}))

async function mList() { const mod = await import('../app/api/artist/artworks/route'); return mod }
async function mItem() { const mod = await import('../app/api/artist/artworks/[id]/route'); return mod }

const makeGET = (url = 'http://localhost/api/artist/artworks') => ({ url, headers: new Headers() }) as any
const makeForm = (obj: Record<string,string>) => { const fd = new FormData(); Object.entries(obj).forEach(([k,v])=>fd.append(k,v)); return fd }

describe('API /api/artist/artworks CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploadImageFile.mockResolvedValue({ url: 'https://cdn.example.com/new.png' })
  })

  it('GET list returns 401 if not artist', async () => {
    const { GET } = await mList()
    const res = await GET(makeGET())
    expect(res.status).toBe(401)
  })

  it('GET list returns artworks for artist', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1' })
    prisma.artwork.findMany.mockResolvedValueOnce([{ id: 'a1', title: 'T' }])
    const { GET } = await mList()
    const res = await GET(makeGET())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data[0].id).toBe('a1')
  })

  it('POST creates artwork with minimal form data', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artist.findUnique.mockResolvedValueOnce({ id: 'ar1', name: 'Artist' })
    prisma.artwork.create.mockResolvedValueOnce({ id: 'a1', title: 'New' })
    const { POST } = await mList()
    const req = { headers: new Headers(), async formData() { return makeForm({ title: 'New', imageUrl: '/img.png', price: '', year: '', dimensions: '', description: '', categoryId: '' }) } } as any
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('a1')
  })

  it('POST auto-creates artist profile when missing', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist', name: 'Nouveau', email: 'nouveau@example.com' } })
    prisma.artist.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'ar1', name: 'Nouveau' })
    prisma.user.findUnique.mockResolvedValueOnce({ name: 'Nouveau' })
    prisma.artist.create.mockResolvedValueOnce({ id: 'ar1', name: 'Nouveau' })
    prisma.artwork.create.mockResolvedValueOnce({ id: 'a1', title: 'New' })
    const { POST } = await mList()
    const req = { headers: new Headers(), async formData() { return makeForm({ title: 'New', imageUrl: '/img.png', price: '', year: '', dimensions: '', description: '', categoryId: '' }) } } as any
    const res = await POST(req)
    expect(prisma.artist.create).toHaveBeenCalled()
    expect(res.status).toBe(201)
  })

  it('GET item returns 404 if not owned', async () => {
    const { auth } = await import('@/auth') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    const { prisma } = await import('@/lib/prisma') as any
    prisma.artwork.findFirst.mockResolvedValueOnce(null)
    const { GET } = await mItem()
    const res = await GET(makeGET(), { params: { id: 'a1' } })
    expect(res.status).toBe(404)
  })

  it('PUT updates item', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artwork.findFirst.mockResolvedValueOnce({ id: 'a1', imageUrl: '/x.png' })
    prisma.artwork.update.mockResolvedValueOnce({ id: 'a1', title: 'Upd' })
    const { PUT } = await mItem()
    const req = { headers: new Headers(), async formData() { return makeForm({ title: 'Upd', dimensions: '', description: '', categoryId: '' }) } } as any
    const res = await PUT(req, { params: { id: 'a1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.title).toBe('Upd')
  })

  it('PUT rejects invalid category id values', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artwork.findFirst.mockResolvedValueOnce({ id: 'a1', imageUrl: '/x.png' })
    const { PUT } = await mItem()
    const req = {
      headers: new Headers(),
      async formData() {
        return makeForm({ title: 'Upd', categoryId: 'not-a-uuid' })
      },
    } as any
    const res = await PUT(req, { params: { id: 'a1' } })
    expect(res.status).toBe(400)
    expect(prisma.artwork.update).not.toHaveBeenCalled()
  })

  it('PUT uploads a new image file when provided', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artwork.findFirst.mockResolvedValueOnce({ id: 'a1', imageUrl: '/x.png' })
    prisma.artwork.update.mockResolvedValueOnce({ id: 'a1', imageUrl: 'https://cdn.example.com/new.png' })
    const { PUT } = await mItem()
    const file = new File(['data'], 'photo.png', { type: 'image/png' })
    const req = {
      headers: new Headers(),
      async formData() {
        const fd = new FormData()
        fd.append('title', 'Upd')
        fd.append('image', file)
        fd.append('imageUrl', '')
        return fd
      },
    } as any
    const res = await PUT(req, { params: { id: 'a1' } })
    expect(res.status).toBe(200)
    expect(uploadImageFile).toHaveBeenCalledWith(file)
    expect(prisma.artwork.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ imageUrl: 'https://cdn.example.com/new.png' }),
      }),
    )
  })

  it('DELETE removes item', async () => {
    const { auth } = await import('@/auth') as any
    const { prisma } = await import('@/lib/prisma') as any
    auth.mockResolvedValueOnce({ user: { id: 'u1', role: 'artist' } })
    prisma.artwork.findFirst.mockResolvedValueOnce({ id: 'a1' })
    prisma.artwork.delete.mockResolvedValueOnce({})
    const { DELETE } = await mItem()
    const res = await DELETE(makeGET(), { params: { id: 'a1' } })
    expect(res.status).toBe(200)
  })
})
