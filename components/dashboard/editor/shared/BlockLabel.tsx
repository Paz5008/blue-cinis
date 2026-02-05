import { getBlockDefinition } from '@/lib/cms/blockRegistry';
import type { BlockType } from '@/types/cms';

interface BlockLabelProps {
    /** Block type to get label for */
    type: BlockType;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show description alongside label */
    showDescription?: boolean;
    /** Fallback label if not found in registry */
    fallback?: string;
}

/**
 * Renders the localized label for a block type from the registry.
 * 
 * @example
 * ```tsx
 * <BlockLabel type="text" />
 * // Renders: "Texte"
 * 
 * <BlockLabel type="gallery" showDescription />
 * // Renders: "Galerie - Galerie d'images en grille ou carousel"
 * ```
 */
export function BlockLabel({
    type,
    className = '',
    showDescription = false,
    fallback,
}: BlockLabelProps) {
    const def = getBlockDefinition(type);
    const label = def?.label || fallback || type;

    if (!showDescription || !def?.description) {
        return <span className={className}>{label}</span>;
    }

    return (
        <span className={className}>
            {label}
            <span className="text-neutral-500 ml-1.5 font-normal">
                — {def.description}
            </span>
        </span>
    );
}

/**
 * Get block label as a string (useful for non-JSX contexts).
 */
export function getBlockLabel(type: BlockType, fallback?: string): string {
    const def = getBlockDefinition(type);
    return def?.label || fallback || type;
}

/**
 * Get block description as a string.
 */
export function getBlockDescription(type: BlockType): string | undefined {
    const def = getBlockDefinition(type);
    return def?.description;
}

export default BlockLabel;
