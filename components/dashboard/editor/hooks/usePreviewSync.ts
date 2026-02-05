import { useState, useEffect, useCallback, useRef } from 'react';
import { Block, ThemeConfig } from '@/types/cms';

/**
 * Message types for preview communication
 */
export interface PreviewMessage {
    type: 'BLOCKS_UPDATE' | 'THEME_UPDATE' | 'BLOCK_SELECTED' | 'BLOCK_HOVER' | 'HIGHLIGHT_BLOCK';
    payload: unknown;
}

/**
 * Données synchronisées pour le mode preview
 */
interface PreviewData {
    blocks: Block[];
    theme: ThemeConfig;
    timestamp: number;
}

interface UsePreviewSyncOptions {
    /** Callback when a block is selected from the preview iframe */
    onBlockSelect?: (blockId: string) => void;
    /** Callback when a block is hovered in the preview iframe */
    onBlockHover?: (blockId: string | null) => void;
    /** Reference to the preview iframe */
    iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

/**
 * Hook de synchronisation automatique entre le mode éditeur et le mode aperçu.
 * 
 * Supports:
 * - Debounced synchro of blocks/theme to preview
 * - postMessage communication with iframe
 * - Block selection from preview
 * - Block hover highlighting
 * 
 * @param blocks - Blocs actuels de l'éditeur
 * @param theme - Thème actuel de l'éditeur
 * @param debounceMs - Délai de debouncing en millisecondes (défaut: 300ms, 0 to disable)
 * @param options - Callbacks and refs for bidirectional communication
 * @returns Données synchronisées et méthodes de contrôle
 * 
 * @example
 * ```tsx
 * const { blocks: previewBlocks, sendBlocksToPreview, highlightBlock } = usePreviewSync(
 *   blocks, 
 *   theme,
 *   300,
 *   { 
 *     onBlockSelect: (id) => setSelectedIndex(blocks.findIndex(b => b.id === id)),
 *     iframeRef
 *   }
 * );
 * ```
 */
export const usePreviewSync = (
    blocks: Block[],
    theme: ThemeConfig,
    debounceMs: number = 300,
    options: UsePreviewSyncOptions = {}
): PreviewData & {
    sendBlocksToPreview: () => void;
    highlightBlock: (blockId: string | null) => void;
} => {
    const { onBlockSelect, onBlockHover, iframeRef } = options;

    const [previewData, setPreviewData] = useState<PreviewData>({
        blocks,
        theme,
        timestamp: Date.now()
    });

    const lastSentRef = useRef<number>(0);

    // Send message to iframe
    const sendToIframe = useCallback((message: PreviewMessage) => {
        if (iframeRef?.current?.contentWindow) {
            try {
                iframeRef.current.contentWindow.postMessage(message, '*');
            } catch {
                // Ignore cross-origin errors
            }
        }
    }, [iframeRef]);

    // Send blocks update to preview
    const sendBlocksToPreview = useCallback(() => {
        const now = Date.now();
        lastSentRef.current = now;

        sendToIframe({
            type: 'BLOCKS_UPDATE',
            payload: {
                blocks,
                theme,
                timestamp: now
            }
        });
    }, [blocks, theme, sendToIframe]);

    // Highlight a specific block in preview
    const highlightBlock = useCallback((blockId: string | null) => {
        sendToIframe({
            type: 'HIGHLIGHT_BLOCK',
            payload: { blockId }
        });
    }, [sendToIframe]);

    // Debounced sync
    useEffect(() => {
        if (debounceMs <= 0) {
            // Immediate sync when disabled
            setPreviewData({
                blocks,
                theme,
                timestamp: Date.now()
            });
            return;
        }

        const timeoutId = setTimeout(() => {
            setPreviewData({
                blocks,
                theme,
                timestamp: Date.now()
            });

            // Also send to iframe if available
            sendBlocksToPreview();
        }, debounceMs);

        return () => clearTimeout(timeoutId);
    }, [blocks, theme, debounceMs, sendBlocksToPreview]);

    // Listen for messages from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = event.data as PreviewMessage;

            if (!data || typeof data.type !== 'string') return;

            switch (data.type) {
                case 'BLOCK_SELECTED':
                    if (onBlockSelect && data.payload) {
                        const { blockId } = data.payload as { blockId: string };
                        if (blockId) {
                            onBlockSelect(blockId);
                        }
                    }
                    break;
                case 'BLOCK_HOVER':
                    if (onBlockHover) {
                        const { blockId } = data.payload as { blockId: string | null };
                        onBlockHover(blockId);
                    }
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onBlockSelect, onBlockHover]);

    return {
        ...previewData,
        sendBlocksToPreview,
        highlightBlock
    };
};

