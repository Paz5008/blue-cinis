/**
 * Memoized block wrapper for optimized re-rendering.
 * Uses React.memo with custom comparator for performance.
 *
 * @module MemoizedBlockWrapper
 */
'use client';

import React, { memo, ReactNode } from 'react';
import type { Block } from '@/types/cms';

export interface MemoizedBlockWrapperProps {
    /** The block data */
    block: Block;
    /** Whether the block is currently selected */
    isSelected: boolean;
    /** Whether the block is being dragged */
    isDragging?: boolean;
    /** Children to render */
    children: ReactNode;
    /** Additional className */
    className?: string;
    /** Click handler */
    onClick?: () => void;
}

/**
 * Custom equality function for block wrapper.
 * Performs shallow comparison for performance-critical props.
 */
function areEqual(
    prev: MemoizedBlockWrapperProps,
    next: MemoizedBlockWrapperProps
): boolean {
    // Quick bail-outs for selection/drag state changes
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.isDragging !== next.isDragging) return false;
    if (prev.className !== next.className) return false;

    // Same block ID is critical
    if (prev.block.id !== next.block.id) return false;

    // Deep comparison only for known mutable fields
    // This is more efficient than JSON.stringify for large blocks
    if (prev.block.type !== next.block.type) return false;
    if (prev.block.x !== next.block.x) return false;
    if (prev.block.y !== next.block.y) return false;
    if (prev.block.width !== next.block.width) return false;
    if (prev.block.height !== next.block.height) return false;
    if (prev.block.rotation !== next.block.rotation) return false;
    if (prev.block.zIndex !== next.block.zIndex) return false;

    // For style, do shallow reference check first, then shallow key comparison
    if (prev.block.style !== next.block.style) {
        // If references differ, check if actual values changed
        const prevStyle = prev.block.style || {};
        const nextStyle = next.block.style || {};
        const prevKeys = Object.keys(prevStyle);
        const nextKeys = Object.keys(nextStyle);

        if (prevKeys.length !== nextKeys.length) return false;

        for (const key of prevKeys) {
            if (prevStyle[key] !== nextStyle[key]) return false;
        }
    }

    // For content-heavy blocks, compare content hash or length
    if ('content' in prev.block && 'content' in next.block) {
        if (prev.block.content !== next.block.content) return false;
    }

    // Children are not compared - assumed stable via key prop
    return true;
}

/**
 * Memoized wrapper component for blocks.
 * Prevents unnecessary re-renders when parent state changes.
 *
 * @example
 * ```tsx
 * <MemoizedBlockWrapper
 *   block={block}
 *   isSelected={selectedId === block.id}
 *   onClick={() => selectBlock(block.id)}
 * >
 *   <BlockContent block={block} />
 * </MemoizedBlockWrapper>
 * ```
 */
export const MemoizedBlockWrapper = memo(function MemoizedBlockWrapper({
    block,
    isSelected,
    isDragging = false,
    children,
    className = '',
    onClick,
}: MemoizedBlockWrapperProps) {
    return (
        <div
            className={`memoized-block-wrapper ${className} ${isSelected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
            data-block-id={block.id}
            data-block-type={block.type}
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-selected={isSelected}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick?.();
                }
            }}
        >
            {children}
        </div>
    );
}, areEqual);

export default MemoizedBlockWrapper;
