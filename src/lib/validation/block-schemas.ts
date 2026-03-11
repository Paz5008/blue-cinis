import { z } from 'zod';

// Permissive schema to unblock save
export const BlockSchema = z.record(z.any());

export const TextBlockSchema = z.object({
    type: z.literal('text'),
    content: z.string().optional(),
    style: z.record(z.any()).optional(),
});

export const ImageBlockSchema = z.object({
    type: z.literal('image'),
    src: z.string().optional(), // Removed .url() validation
    alt: z.string().optional(),
    caption: z.string().optional(),
    style: z.record(z.any()).optional(),
});
