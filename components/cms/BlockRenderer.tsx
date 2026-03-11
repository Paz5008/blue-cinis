import React, { useMemo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
    Block,
    BlockType
} from '@/types/cms';
import { RenderContext } from './renderers/types';
import { sanitizeTextHtml } from '@/lib/sanitize';
import { composeBlockStyle } from '@/lib/cms/style';
import { getBlockPositionStyle } from '@/lib/cms/blockPositioning';

// Import individual renderers from the registry or directly
import { TextRenderer } from './renderers/TextRenderer';
import { ImageRenderer } from './renderers/ImageRenderer';
import { GalleryRenderer } from './renderers/GalleryRenderer';
import { VideoRenderer } from './renderers/VideoRenderer';
import { ButtonRenderer } from './renderers/ButtonRenderer';
import { DividerRenderer } from './renderers/DividerRenderer';
import { ArtworkListRenderer } from './renderers/ArtworkListRenderer';
import { ArtistNameRenderer } from './renderers/ArtistNameRenderer';
import { ArtistBioRenderer } from './renderers/ArtistBioRenderer';
import { ArtistPhotoRenderer } from './renderers/ArtistPhotoRenderer';
import { ContactFormRenderer } from './renderers/ContactFormRenderer';
import { EmbedRenderer } from './renderers/EmbedRenderer';
import { ColumnsRenderer } from './renderers/ColumnsRenderer';
import { OeuvreRenderer } from './renderers/OeuvreRenderer';
import { EventListRenderer } from './renderers/EventListRenderer';
import { BookRenderer } from './renderers/BookRenderer';

interface BlockRendererProps {
    blocks: Block[];
    artist: any; // Type 'Artist' ideally
    artworks: any[]; // List of available artworks for the artist
    enableAbsolutePositioning?: boolean;
    pageKey?: "banner" | "poster" | "profile"; // Optional context for sanitization/rendering

}

export default function BlockRenderer({
    blocks,
    artist,
    artworks,
    enableAbsolutePositioning = false,
    pageKey = "poster"
}: BlockRendererProps) {
    if (!blocks || !Array.isArray(blocks)) return null;

    // Create a stable context object for the renderers
    // We intentionally create a minimal context for the public view
    const context: RenderContext = useMemo(() => ({
        artist: artist,
        artworks: artworks, // Accessible directement pour OeuvreRenderer et autres
        sanitize: (html: string) => sanitizeTextHtml(html, pageKey),
        searchString: '',
        isPreview: false,
        useNextLink: true,
        LinkComponent: Link,
        pageKey: pageKey,
        isMobile: false, // Default to desktop view for server rendering, hydration might adjust if needed (but usually we want responsive CSS)
        disablePositioning: !enableAbsolutePositioning,
        debug: false,
        // Recursive render function
        renderBlock: (b: any, index: number) => (
            <SingleBlockRenderer
                key={b.id || index}
                block={b}
                index={index}
                context={context}
                enableAbsolutePositioning={enableAbsolutePositioning}
            />
        )
    }), [artist, artworks, enableAbsolutePositioning, pageKey]);

    return (
        <>
            {blocks.map((block, index) => (
                <SingleBlockRenderer
                    key={block.id || index}
                    block={block}
                    index={index}
                    context={context}
                    enableAbsolutePositioning={enableAbsolutePositioning}
                />
            ))}
        </>
    );
}

// Map BlockType to Component
const RENDERER_MAP: Record<string, React.FC<any>> = {
    text: TextRenderer,
    image: ImageRenderer,
    gallery: GalleryRenderer,
    video: VideoRenderer,
    button: ButtonRenderer,
    divider: DividerRenderer,
    artworkList: ArtworkListRenderer,
    oeuvre: OeuvreRenderer,
    artistName: ArtistNameRenderer,
    artistBio: ArtistBioRenderer,
    artistPhoto: ArtistPhotoRenderer,
    contactForm: ContactFormRenderer,
    embed: EmbedRenderer,
    columns: ColumnsRenderer,
    eventList: EventListRenderer,
    book: BookRenderer,
};

import { buildHoverCSS, buildResponsiveCSS, buildVisibilityCSS } from '@/lib/cms/css-generator';
import { BlockAnimationWrapper } from './BlockAnimationWrapper';

export const SingleBlockRenderer = React.memo(({
    block,
    index,
    context,
    enableAbsolutePositioning = false
}: {
    block: Block,
    index: number,
    context: RenderContext,
    enableAbsolutePositioning?: boolean
}) => {
    const Component = RENDERER_MAP[block.type];

    if (!Component) {
        console.warn(`No renderer found for block type: ${block.type}`);
        return null;
    }

    // Resolve style using the unified logic
    // We pass this as 'style' prop to the renderer, which it merges with its own base style
    // However, some renderers might already call composeBlockStyle internally.
    // The convention in UniversalBlockRenderer is:
    // Renderer({ block, context, styleArg }) -> const base = compose(block.style); const union = { ...base, ...styleArg };
    // So we can pass specific override styles here if needed, but for public view, standard style is enough.

    // For Absolute Positioning (FreeForm):
    // If enabled, we wrap the component in a positioned div.
    // The component itself receives the block, so it renders its inner content.
    // We MUST ensure logical styles (like color, font) are passed down, but layout styles (x, y) are handled by wrapper.

    // If NOT enabled (Flow Layout):
    // We simply render the component. It will handle its own margins/padding via composeBlockStyle.

    const content = <Component block={block} index={index} context={context} />;
    const blockId = block.id || `blk-${index}`;
    const elementId = `blk-${blockId}`;

    // Generate Advanced CSS
    // Memoize these heavy text generation functions
    const hoverCss = useMemo(() => buildHoverCSS(block), [block]);
    const responsiveCss = useMemo(() => buildResponsiveCSS(block), [block]);
    const visibilityCss = useMemo(() => buildVisibilityCSS(block), [block]);

    // Wrapper Logic
    // Even if not absolute, we might need a wrapper for visibility/hover/responsive targeting if the renderer doesn't support ID injection on root.
    // Most renderers spread style but might not support ID or might not be the root element targeted by CSS.
    // The safest way for "External CSS" targeting is to wrap in a Fragment or Div with ID, 
    // BUT 'content' already renders the block. We need to attach the ID to the rendered output or wrap it.
    // Let's use a wrapper div with display: contents (like in page.tsx) to avoid layout side effects 
    // ensuring the ID is present for the CSS selectors to match.

    // Wrap with animation if specified in block style
    const animationType = block.style?.animation;
    const innerContent = animationType ? (
        <BlockAnimationWrapper type={animationType} delay={index * 0.1}>
            {content}
        </BlockAnimationWrapper>
    ) : content;

    const wrappedContent = (
        <React.Fragment key={blockId}>
            {visibilityCss ? <style dangerouslySetInnerHTML={{ __html: visibilityCss }} /> : null}
            {responsiveCss ? <style dangerouslySetInnerHTML={{ __html: responsiveCss }} /> : null}
            {hoverCss ? <style dangerouslySetInnerHTML={{ __html: hoverCss }} /> : null}
            <div id={elementId} style={{ display: 'contents' }}>
                {innerContent}
            </div>
        </React.Fragment>
    );

    if (enableAbsolutePositioning && (block.x !== undefined || block.y !== undefined)) {
        return (
            <div
                style={getBlockPositionStyle(block, true)}
                className={clsx(!block.width && "w-fit", !block.height && "h-fit")}
            >
                {wrappedContent}
            </div>
        );
    }

    return wrappedContent;
}, (prevProps, nextProps) => {
    // Custom comparison to ensure deep check where it matters, but usually shallow prop check is enough for block object ref stability
    // However, blocks are often new objects.
    // We should check if block.id is same and if block content/style hasn't changed.
    // For now, let's rely on React.memo defaults (shallow comparison) assuming immutable updates in editor.
    return prevProps.block === nextProps.block &&
        prevProps.index === nextProps.index &&
        prevProps.enableAbsolutePositioning === nextProps.enableAbsolutePositioning &&
        prevProps.context === nextProps.context;
});
