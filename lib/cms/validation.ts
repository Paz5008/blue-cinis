import { z } from 'zod';

// Helper for responsive dimensions
const responsiveDimensionSchema = z.object({
    desktop: z.string().optional(),
    mobile: z.string().optional(),
});

// Helper for standard style properties to avoid repetition
const blockStyleSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), responsiveDimensionSchema, z.undefined()])).optional();

import { BlockSchema } from '@/lib/validation/block-schemas';

// Full export
export const contentPayloadSchema = z.object({
    blocksData: z.record(z.string(), BlockSchema),
    layout: z.object({
        desktop: z.array(z.string()),
        mobile: z.array(z.string()).optional(), // Made optional for desktop-only validation compatibility
    }),
    theme: z.record(z.any()).optional(), // validation can be stricter later
    meta: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        canonicalUrl: z.string().optional(),
    }).optional(),
});

export type ContentPayload = z.infer<typeof contentPayloadSchema>;
