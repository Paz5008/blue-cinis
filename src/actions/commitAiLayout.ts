'use server';

import { prisma } from "@/lib/prisma";
import { withArtistAuth } from "@/lib/safe-action";
import { blockProtocolSchema } from "@/lib/cms/blockSchemas";
import { saveArtistPageLayout } from "./save-layout";

// Coût fixe pour appliquer un design final généré par l'IA
const COMMIT_COST = 500;

export async function commitAiLayout(blocks: any[], pageKey: string = 'profile', theme?: any) {
    return withArtistAuth(async (data: { blocks: any[]; pageKey: string; theme?: any }, session: any) => {
        const userId = session.user.id;
        const { blocks, pageKey, theme } = data;

        // 1. Validation Zod stricte : on ne sauvegarde jamais de JSON invalide en base
        const validation = blockProtocolSchema.safeParse(blocks);
        if (!validation.success) {
            console.error("Zod Validation Failed:", validation.error.format());
            throw new Error("La structure du design est invalide.");
        }

        // 2. Fetch User and Token Balance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { aiTokens: true, id: true }
        });

        if (!user) {
            throw new Error("Utilisateur introuvable.");
        }

        if (user.aiTokens < COMMIT_COST) {
            throw new Error("TOKENS_LIMIT_REACHED");
        }

        try {
            // 3. Déduction des tokens
            await prisma.user.update({
                where: { id: userId },
                data: {
                    aiTokens: {
                        decrement: COMMIT_COST
                    }
                }
            });

            // 4. Sauvegarde réelle du layout en base
            const blocksData = blocks.reduce((acc: Record<string, any>, b: any) => ({ ...acc, [b.id]: b }), {});
            const desktopLayout = blocks.map((b: any) => b.id);
            // Layout mobile adaptatif : columns aplaties, book coverflow→slider, spacers réduits
            const mobileBlocks: any[] = [];
            for (const block of blocks) {
                if (block.type === 'columns' && Array.isArray(block.columns)) {
                    for (const col of block.columns) {
                        if (Array.isArray(col.blocks)) mobileBlocks.push(...col.blocks);
                    }
                } else if ((block.type === 'book' || block.type === 'gallery') && block.bookStyle === 'coverflow') {
                    mobileBlocks.push({ ...block, bookStyle: 'slider' });
                } else if (block.type === 'spacer' && (block.height ?? 80) > 60) {
                    mobileBlocks.push({ ...block, height: 40 });
                } else {
                    mobileBlocks.push(block);
                }
            }
            const mobileLayout = mobileBlocks.map((b: any) => b.id);

            await saveArtistPageLayout(
                'desktop',
                {
                    blocksData,
                    theme: theme || {},
                    layout: { desktop: desktopLayout, mobile: mobileLayout },
                },
                theme || {},
                pageKey
            );

            return {
                success: true,
                remainingTokens: user.aiTokens - COMMIT_COST
            };

        } catch (error) {
            console.error("AI Commit failed:", error);
            throw new Error("Une erreur est survenue lors de l'application du design.");
        }

    }, { blocks, pageKey, theme });
}
