import React from 'react';
import { Block } from '@/types/cms';
// import { cn } from '@/lib/utils';
import BlockRenderer from '@/components/cms/BlockRenderer';
import { calculateContentHeight } from '@/lib/cms/blockPositioning';

interface PreviewFrameProps {
    blocks: Block[];
    width?: number; // Simulated viewport width
    height?: number;
    artist?: any;
    artworks?: any[];
    enableAbsolutePositioning?: boolean;
}

export function PreviewFrame({ blocks, width, height, artist, artworks, enableAbsolutePositioning }: PreviewFrameProps) {
    // Calculate required height for absolute positioning using unified utility
    const contentHeight = React.useMemo(() => {
        return calculateContentHeight(blocks, enableAbsolutePositioning || false);
    }, [blocks, enableAbsolutePositioning]);

    const finalMinHeight = height || Math.max(800, contentHeight);

    return (
        <div
            className="relative bg-white mx-auto shadow-2xl ring-1 ring-black/5"
            style={{
                width: width || '100%',
                minHeight: finalMinHeight,
                // If explicit height (banner), clamp it. Else allow expansion.
                // NOTE: For absolute positioning to scroll, the container MUST have enough height.
                height: height ? height : (enableAbsolutePositioning ? Math.max(finalMinHeight, contentHeight) : 'auto'),
                overflowY: height ? 'hidden' : 'visible',
                overflowX: 'hidden'
            }}
        >
            <BlockRenderer
                blocks={blocks}
                artist={artist || {}}
                artworks={artworks || []}
                enableAbsolutePositioning={enableAbsolutePositioning}
            />
        </div>
    );
}
