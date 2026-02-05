'use client';

import React, { useState } from 'react';
import type { Block, BlockType } from '@/types/cms';

// Block type labels in French
const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
    text: 'Texte',
    image: 'Image',
    gallery: 'Galerie',
    video: 'Vidéo',
    embed: 'Intégration',
    divider: 'Séparateur',
    columns: 'Colonnes',
    button: 'Bouton',
    oeuvre: 'Œuvres',
    artworkList: 'Liste d\'œuvres',
    artistName: 'Nom artiste',
    artistPhoto: 'Photo artiste',
    artistBio: 'Biographie',
    contactForm: 'Formulaire',
    eventList: 'Événements',
};

interface PreviewModeOverlayProps {
    block: Block;
    isSelected: boolean;
    isHovered: boolean;
    onSelect: (blockId: string) => void;
    onHover: (blockId: string | null) => void;
    children: React.ReactNode;
}

/**
 * PreviewModeOverlay - Overlay for blocks in preview mode
 * Shows boundaries and allows selection from preview
 */
export function PreviewModeOverlay({
    block,
    isSelected,
    isHovered,
    onSelect,
    onHover,
    children,
}: PreviewModeOverlayProps) {
    const label = BLOCK_TYPE_LABELS[block.type] || block.type;

    return (
        <div
            className="relative group/preview-block"
            onMouseEnter={() => onHover(block.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(block.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(block.id);
                }
            }}
            aria-label={`Sélectionner le bloc ${label}`}
            data-block-id={block.id}
            data-block-type={block.type}
        >
            {/* Block content */}
            {children}

            {/* Overlay border */}
            <div
                className={`
          absolute inset-0 pointer-events-none transition-all duration-150
          ${isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-500/5'
                        : isHovered
                            ? 'ring-1 ring-blue-400/60 bg-blue-400/5'
                            : 'ring-0'
                    }
        `}
                style={{ borderRadius: 'inherit' }}
            />

            {/* Type label tooltip */}
            {(isHovered || isSelected) && (
                <div
                    className={`
            absolute -top-6 left-1/2 -translate-x-1/2 z-50
            px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap
            ${isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-800 text-white'
                        }
          `}
                >
                    {label}
                    {isSelected && (
                        <span className="ml-1 opacity-70">• sélectionné</span>
                    )}
                </div>
            )}
        </div>
    );
}

interface PreviewBlockWrapperProps {
    blocks: Block[];
    selectedBlockId: string | null;
    onSelectBlock: (blockId: string) => void;
    renderBlock: (block: Block, index: number) => React.ReactNode;
}

/**
 * PreviewBlockWrapper - Wraps all blocks with preview overlays
 */
export function PreviewBlockWrapper({
    blocks,
    selectedBlockId,
    onSelectBlock,
    renderBlock,
}: PreviewBlockWrapperProps) {
    const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

    return (
        <div className="preview-mode-container">
            {blocks.map((block, index) => (
                <PreviewModeOverlay
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    isHovered={hoveredBlockId === block.id}
                    onSelect={onSelectBlock}
                    onHover={setHoveredBlockId}
                >
                    {renderBlock(block, index)}
                </PreviewModeOverlay>
            ))}
        </div>
    );
}

// Message types for postMessage communication
export interface PreviewMessage {
    type: 'BLOCKS_UPDATE' | 'BLOCK_SELECTED' | 'BLOCK_HOVER' | 'THEME_UPDATE';
    payload: unknown;
}

export interface BlocksUpdatePayload {
    blocks: Block[];
    timestamp: number;
}

export interface BlockSelectedPayload {
    blockId: string;
}

export interface BlockHoverPayload {
    blockId: string | null;
}

/**
 * Utility to send messages to parent window (when in iframe preview)
 */
export function sendPreviewMessage(message: PreviewMessage) {
    if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage(message, '*');
    }
}

/**
 * Hook to listen for preview messages from parent window
 */
export function usePreviewMessageListener(
    onBlocksUpdate?: (blocks: Block[]) => void,
    onBlockSelected?: (blockId: string) => void,
    onBlockHover?: (blockId: string | null) => void
) {
    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = event.data as PreviewMessage;

            if (!data || typeof data.type !== 'string') return;

            switch (data.type) {
                case 'BLOCKS_UPDATE':
                    if (onBlocksUpdate && data.payload) {
                        const payload = data.payload as BlocksUpdatePayload;
                        onBlocksUpdate(payload.blocks);
                    }
                    break;
                case 'BLOCK_SELECTED':
                    if (onBlockSelected && data.payload) {
                        const payload = data.payload as BlockSelectedPayload;
                        onBlockSelected(payload.blockId);
                    }
                    break;
                case 'BLOCK_HOVER':
                    if (onBlockHover && data.payload !== undefined) {
                        const payload = data.payload as BlockHoverPayload;
                        onBlockHover(payload.blockId);
                    }
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onBlocksUpdate, onBlockSelected, onBlockHover]);
}

export default PreviewModeOverlay;
