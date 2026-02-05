import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '../app/api/artist/customization/route';
import { prisma } from '@/lib/prisma';
import { ensureArtistSession } from '@/lib/artistGuard';
import { ContentPayloadSchema } from '@/lib/cmsSchema';

// Mock dependencies
vi.mock('@/lib/artistGuard', () => ({
    ensureArtistSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        artistPage: {
            upsert: vi.fn(),
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/cmsSchema', async () => {
    const actual = await vi.importActual('@/lib/cmsSchema');
    return {
        ...actual as any,
    };
});

describe('PUT /api/artist/customization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ensureArtistSession as any).mockResolvedValue({
            user: { id: 'user_123', role: 'artist' },
        });
        (prisma.user.findUnique as any).mockResolvedValue({
            id: 'user_123',
            email: 'test@example.com',
            name: 'Test Artist',
        });
    });

    it('should return 200 JSON on valid save', async () => {
        const payload = {
            // action: undefined means save as draft (not publish)
            blocks: [
                { id: 'b1', type: 'text', content: 'Hello World', style: {} }
            ],
            theme: {},
            meta: { title: 'Test Page', description: '' },
            settings: {}
        };

        const request = {
            json: async () => payload,
        } as unknown as Request;

        (prisma.artistPage.upsert as any).mockResolvedValue({
            status: 'draft',
            draftContent: payload,
            updatedAt: new Date(),
        });

        const response = await PUT(request as any);

        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.blocks).toBeDefined();
        // Check for _status which we added
        expect(json._status).toBe('draft');
    });

    it('should handle unauthorized access gracefully', async () => {
        (ensureArtistSession as any).mockResolvedValue(null);

        const request = {
            json: async () => ({}),
        } as unknown as Request;

        const response = await PUT(request as any);
        expect(response.status).toBe(401);
    });
});
