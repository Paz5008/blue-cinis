import { getBlockDefinition } from '@/lib/cms/blockRegistry';
import type { BlockType } from '@/types/cms';
import { HelpCircle, LucideIcon } from 'lucide-react';

interface BlockIconProps {
    /** Block type to get icon for */
    type: BlockType;
    /** Icon size in pixels */
    size?: number;
    /** Additional CSS classes */
    className?: string;
    /** Stroke width */
    strokeWidth?: number;
}

/**
 * Renders the icon for a block type from the registry.
 * Falls back to HelpCircle if not found.
 * 
 * @example
 * ```tsx
 * <BlockIcon type="text" size={16} />
 * <BlockIcon type="gallery" className="text-blue-500" />
 * ```
 */
export function BlockIcon({
    type,
    size = 16,
    className = '',
    strokeWidth = 2,
}: BlockIconProps) {
    const def = getBlockDefinition(type);
    const Icon = def?.icon || HelpCircle;

    return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}

/**
 * Get the icon component for a block type.
 * Useful when you need to use the icon elsewhere.
 */
export function getBlockIcon(type: BlockType): LucideIcon {
    const def = getBlockDefinition(type);
    return def?.icon || HelpCircle;
}

export default BlockIcon;
