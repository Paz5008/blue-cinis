import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureArtistSession } from '@/lib/artistGuard';
import { ContentPayloadSchema } from '@/lib/cmsSchema';
import { sanitizeBlockStylesDeep } from '@/lib/cms/style';
import { sanitizeTextHtml } from '@/lib/sanitize';
import { sanitizeEmbedBlock } from '@/lib/cms/embed';
import { z } from 'zod';

// Schema for the specific Save Action
const SaveActionSchema = z.object({
    action: z.enum(['save_draft', 'request_review']),
    key: z.string().default('profile'), // Default key if not specific
    // We merge this with the payload schema or handle payload validation separately
    blocks: z.array(z.any()), // Validated deeper later
    theme: z.any().optional(),
    meta: z.any().optional(),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Guard
        const session = await ensureArtistSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // 2. Parse Body & Validate Structure
        const body = await req.json();

        // Quick validation of action type
        const headerResult = SaveActionSchema.safeParse(body);
        if (!headerResult.success) {
            return NextResponse.json({ error: 'Invalid Request Format' }, { status: 400 });
        }
        const { action, key } = headerResult.data;

        // 3. Deep Validation (Zod + Custom Security Rules)
        // We reuse the ContentPayloadSchema which has the recursive security scan (javascript: check etc)
        const payloadResult = ContentPayloadSchema.safeParse(body);

        if (!payloadResult.success) {
            // Return detailed Zod errors
            return NextResponse.json(
                { error: 'Validation Error', details: payloadResult.error.flatten() },
                { status: 422 }
            );
        }

        const { blocks = [], theme, meta } = payloadResult.data;

        // 4. Sanitize HTML Content (XSS Protection)
        const safeBlocks = blocks.map((b: any) => {
            // Sanitize rich text
            if (b.type === 'text' && typeof b.content === 'string') {
                return sanitizeBlockStylesDeep({ ...b, content: sanitizeTextHtml(b.content, key as any) });
            }
            if (b.type === 'artistBio' && typeof b.content === 'string') {
                return sanitizeBlockStylesDeep({ ...b, content: sanitizeTextHtml(b.content, key as any) });
            }
            // Sanitize Embeds (only whitelisted providers)
            if (b.type === 'embed') {
                const sanitized = sanitizeEmbedBlock(b);
                return sanitized ? sanitizeBlockStylesDeep(sanitized) : null;
            }
            // Default clean styles
            return sanitizeBlockStylesDeep(b);
        }).filter(Boolean); // Remote nulls

        const cleanPayload = {
            blocks: safeBlocks,
            theme,
            meta
        };

        // 5. Database Logic (Governance)
        // If request_review, we allow status change. If save_draft, we stay in draft/pending.

        const statusUpdate = action === 'request_review' ? 'pending_review' : undefined;

        // Validation: Cannot request review with empty content?
        if (action === 'request_review' && safeBlocks.length === 0) {
            return NextResponse.json({ error: 'Cannot publish empty page' }, { status: 400 });
        }

        const updatedPage = await prisma.artistPage.upsert({
            where: {
                userId_key: { userId, key }
            },
            create: {
                userId,
                key,
                draftContent: cleanPayload as any,
                status: statusUpdate || 'draft',
                // publishedContent is initially null
            },
            update: {
                draftContent: cleanPayload as any,
                ...(statusUpdate ? { status: statusUpdate } : {}),
            }
        });

        return NextResponse.json({
            success: true,
            status: updatedPage.status,
            updatedAt: updatedPage.updatedAt
        });

    } catch (error) {
        console.error('[Save Customization Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
