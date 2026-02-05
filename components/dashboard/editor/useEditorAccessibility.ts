
import { useMemo } from 'react';
import { Block } from '@/types/cms';
import { useToast } from '../../../context/ToastContext';

export type AltIssueItem = {
    id: string;
    topLevelId: string;
    topLevelIndex: number;
    topLevelType: string;
    focusId: string;
    targetBlockId: string;
    kind: 'image' | 'galleryImage';
    blockType: string;
    imageId?: string;
    imageIndex?: number;
    src?: string;
    caption?: string;
    altText: string;
    decorative: boolean;
    location: string;
};

export type AltBlockEntry = {
    id: string;
    index: number;
    type: string;
    count: number;
    itemIds: string[];
    label: string;
};

export type MediaIssue = {
    id: string;
    topLevelId: string;
    topLevelIndex: number;
    blockType: 'video' | 'embed';
    title: string;
    hints: string[];
};

type TraversalContext = {
    topId: string;
    topIndex: number;
    topType: string;
    pathLabel: string;
};

export type UseEditorAccessibilityProps = {
    blocks: Block[];
    setBlocks: (blocks: Block[]) => void;
};

export function useEditorAccessibility({ blocks, setBlocks }: UseEditorAccessibilityProps) {
    const { addToast } = useToast();

    const altSummary = useMemo(() => {
        const isAltMissingValue = (value: any, decorative?: boolean) => {
            if (decorative) return false;
            const normalized = typeof value === 'string' ? value.trim() : '';
            if (!normalized) return true;
            return /^image\d+$/i.test(normalized);
        };

        const items: Record<string, AltIssueItem> = {};
        const per: AltBlockEntry[] = [];
        const mediaIssues: MediaIssue[] = [];
        let total = 0;

        const registerMediaIssue = (ctx: TraversalContext, blockId: string | undefined, blockType: 'video' | 'embed', hints: string[]) => {
            if (hints.length === 0) return;
            mediaIssues.push({
                id: blockId || `${ctx.topId}-${blockType}`,
                topLevelId: ctx.topId,
                topLevelIndex: ctx.topIndex,
                blockType,
                title: ctx.pathLabel,
                hints,
            });
        };

        const traverse = (node: any, ctx: TraversalContext, collector: string[]) => {
            if (!node || typeof node !== 'object') return;

            if (node.type === 'image') {
                if (isAltMissingValue(node.altText, node.decorative)) {
                    const issueId = node.id || `${ctx.topId}-image-${collector.length + 1}`;
                    items[issueId] = {
                        id: issueId,
                        topLevelId: ctx.topId,
                        topLevelIndex: ctx.topIndex,
                        topLevelType: ctx.topType,
                        focusId: ctx.topId,
                        targetBlockId: node.id || ctx.topId,
                        kind: 'image',
                        blockType: 'image',
                        src: node.src,
                        caption: node.caption,
                        altText: node.altText || '',
                        decorative: Boolean(node.decorative),
                        location: ctx.pathLabel,
                    };
                    collector.push(issueId);
                    total += 1;
                }
                return;
            }

            if (node.type === 'gallery') {
                const galleryId = node.id || ctx.topId;
                (node.images || []).forEach((img: any, imgIndex: number) => {
                    if (isAltMissingValue(img?.altText, img?.decorative)) {
                        const issueId = `${galleryId}::${img.id || imgIndex}`;
                        items[issueId] = {
                            id: issueId,
                            topLevelId: ctx.topId,
                            topLevelIndex: ctx.topIndex,
                            topLevelType: ctx.topType,
                            focusId: ctx.topId,
                            targetBlockId: galleryId,
                            kind: 'galleryImage',
                            blockType: 'gallery',
                            imageId: img.id,
                            imageIndex: imgIndex,
                            src: img.src,
                            caption: img.caption,
                            altText: img.altText || '',
                            decorative: Boolean(img.decorative),
                            location: `${ctx.pathLabel} • image #${imgIndex + 1}`,
                        };
                        collector.push(issueId);
                        total += 1;
                    }
                });
            }

            if (node.type === 'video') {
                const hints: string[] = [];
                if (node.autoplay && !node.muted) {
                    hints.push('Activez « Muet » lorsque la lecture automatique est activée.');
                }
                if (node.controls === false) {
                    hints.push('Activez les contrôles du lecteur pour laisser le choix à vos visiteurs.');
                }
                if (!node.caption) {
                    hints.push('Ajoutez une légende ou un descriptif court pour contextualiser la vidéo.');
                }
                if (!node.poster) {
                    hints.push('Ajoutez une image de prévisualisation (poster) pour annoncer le contenu.');
                }
                registerMediaIssue(ctx, node.id, 'video', hints);
            }

            if (node.type === 'embed') {
                const hints: string[] = [];
                if (!node.title || String(node.title).trim().length === 0) {
                    hints.push('Ajoutez un titre accessible à l’iframe pour les lecteurs d’écran.');
                }
                registerMediaIssue(ctx, node.id, 'embed', hints);
            }

            if (node.type === 'container') {
                (node.children || []).forEach((child: any, index: number) =>
                    traverse(child, { topId: ctx.topId, topIndex: ctx.topIndex, topType: ctx.topType, pathLabel: `${ctx.pathLabel} > bloc ${index + 1}` }, collector),
                );
                return;
            }

            if (node.type === 'columns') {
                (node.columns || []).forEach((col: any[], colIndex: number) => {
                    (col || []).forEach((child: any, childIndex: number) =>
                        traverse(
                            child,
                            {
                                topId: ctx.topId,
                                topIndex: ctx.topIndex,
                                topType: ctx.topType,
                                pathLabel: `${ctx.pathLabel} > colonne ${colIndex + 1} / bloc ${childIndex + 1}`,
                            },
                            collector,
                        ),
                    );
                });
                return;
            }
        };

        blocks.forEach((block, index) => {
            const topId = (block as any).id;
            const topType = (block as any).type;
            if (!topId) return;
            const label = `Bloc ${index + 1} · ${topType}`;
            const collector: string[] = [];
            traverse(block, { topId, topIndex: index, topType, pathLabel: label }, collector);
            if (collector.length > 0) {
                per.push({ id: topId, index, type: topType, count: collector.length, itemIds: collector, label });
            }
        });

        return { total, per, items, mediaIssues };
    }, [blocks]);

    const resetGenericAltAll = () => {
        const isGeneric = (s: any) => !!s && /^image\d+$/i.test(String(s).trim());
        let changed = 0;
        const walk = (arr: Block[]): Block[] => arr.map((b: any) => {
            if (b.type === 'image') {
                if (isGeneric(b.altText)) { b = { ...b, altText: '' }; changed++; }
                return b as Block;
            }
            if (b.type === 'gallery') {
                const images = (b.images || []).map((img: any) => {
                    if (isGeneric(img.altText)) { changed++; return { ...img, altText: '' }; }
                    return img;
                });
                return { ...b, images } as Block;
            }
            if (b.type === 'container') {
                const children = (b.children || []).map((ch: Block) => walk([ch])[0]);
                return { ...b, children } as Block;
            }
            if (b.type === 'columns') {
                const columns = (b.columns || []).map((col: Block[]) => walk(col));
                return { ...b, columns } as Block;
            }
            return b as Block;
        });
        const updated = walk(blocks);
        if (changed > 0) {
            setBlocks(updated);
            addToast(`${changed} texte(s) alternatif(s) générique(s) remis à vide.`, 'info');
        } else {
            addToast('Aucun ALT générique à nettoyer.', 'info');
        }
    };

    const exportAltCsv = () => {
        const lines: string[][] = [['block_index', 'block_label', 'issue_id', 'location', 'kind', 'current_alt', 'decorative']];
        altSummary.per.forEach(entry => {
            entry.itemIds.forEach(itemId => {
                const item = altSummary.items[itemId];
                if (!item) return;
                lines.push([
                    String(entry.index + 1),
                    entry.label,
                    item.id,
                    item.location,
                    item.kind,
                    item.altText || '',
                    item.decorative ? 'true' : 'false',
                ]);
            });
        });
        const csv = lines.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'alt_report.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        altSummary,
        resetGenericAltAll,
        exportAltCsv,
    };
}
