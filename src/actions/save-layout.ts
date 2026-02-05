'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { withArtistAuth } from "@/lib/safe-action";
import { contentPayloadSchema } from "@/lib/cms/validation";

export async function saveArtistPageLayout(
    mode: "desktop" | "mobile",
    layoutData: Record<string, any>,
    globalStyles?: Record<string, any>,
    pageKey?: string // Added optional pageKey
) {
    return withArtistAuth(async (data: { mode: "desktop" | "mobile", layoutData: Record<string, any>, globalStyles?: Record<string, any>, pageKey?: string }, session: any) => {
        const userId = session.user.id;
        const key = data.pageKey || 'profile'; // Use passed key or default
        const { layoutData } = data;

        // Zod Validation
        const parsed = contentPayloadSchema.safeParse(layoutData);
        if (!parsed.success) {
            console.error("Layout Validation Failed:", parsed.error);
            // We could throw here, but for now we might want to log logic errors or partial saves.
            // Ideally we reject the save.
            throw new Error(`Données de mise en page invalides: ${JSON.stringify(parsed.error.format())}`);
        }
        const validatedData = parsed.data;

        // Extract parts for optimized columns, using validated data structure
        // Note: validatedData is a union, but we only have one object schema in the union effectively for now matching this structure.
        // We know it matches the object structure if it passed safeParse and we only have one object definition in union or compatible ones.
        const blocksData = 'blocksData' in validatedData ? validatedData.blocksData : {};
        const theme = 'theme' in validatedData ? validatedData.theme || {} : {};
        const deskLayout = 'layout' in validatedData ? validatedData.layout.desktop : [];
        const mobLayout = 'layout' in validatedData ? (validatedData.layout.mobile || []) : [];

        // Save everything to maintain coherence
        const updateData: any = {
            draftContent: validatedData, // The Master Source
            globalStyles: theme,
            desktopLayout: deskLayout,
            mobileLayout: mobLayout
        };

        await prisma.artistPage.upsert({
            where: { userId_key: { userId, key } },
            create: {
                userId,
                key,
                ...updateData
            },
            update: updateData,
        });

        revalidatePath('/studio');
        return { success: true, savedAt: new Date() };
    }, { mode, layoutData, globalStyles });
}
