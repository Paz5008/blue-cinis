import { LucideIcon, MousePointerClick, Layers, Search } from 'lucide-react';

interface EmptyStateProps {
    /** Icon to display - defaults to MousePointerClick */
    icon?: LucideIcon;
    /** Main heading text */
    title: string;
    /** Optional description text */
    description?: string;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_STYLES = {
    sm: {
        container: 'p-4',
        icon: 'w-6 h-6',
        iconWrapper: 'p-2',
        title: 'text-xs font-medium',
        description: 'text-[10px] max-w-[160px]',
        button: 'mt-3 px-3 py-1.5 text-[10px]',
    },
    md: {
        container: 'p-6',
        icon: 'w-8 h-8',
        iconWrapper: 'p-3',
        title: 'text-sm font-medium',
        description: 'text-xs max-w-[200px]',
        button: 'mt-4 px-4 py-2 text-xs',
    },
    lg: {
        container: 'p-8',
        icon: 'w-12 h-12',
        iconWrapper: 'p-4',
        title: 'text-base font-semibold',
        description: 'text-sm max-w-[280px]',
        button: 'mt-6 px-6 py-2.5 text-sm',
    },
};

/**
 * Empty state component for when no content is available.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={MousePointerClick}
 *   title="Aucun bloc sélectionné"
 *   description="Cliquez sur un bloc pour voir ses propriétés"
 * />
 * ```
 */
export function EmptyState({
    icon: Icon = MousePointerClick,
    title,
    description,
    action,
    size = 'md',
}: EmptyStateProps) {
    const styles = SIZE_STYLES[size];

    return (
        <div className={`flex flex-col items-center justify-center h-full text-center ${styles.container}`}>
            <div className={`rounded-full bg-neutral-100 mb-3 ${styles.iconWrapper}`}>
                <Icon className={`text-neutral-400 ${styles.icon}`} />
            </div>
            <h3 className={`text-neutral-700 ${styles.title}`}>{title}</h3>
            {description && (
                <p className={`text-neutral-500 mt-1 ${styles.description}`}>
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className={`font-medium bg-neutral-900 text-white rounded-lg 
                               hover:bg-neutral-800 transition-colors focus:outline-none 
                               focus:ring-2 focus:ring-neutral-300 ${styles.button}`}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Pre-configured variants for common use cases
export function NoBlockSelected() {
    return (
        <EmptyState
            icon={MousePointerClick}
            title="Aucun bloc sélectionné"
            description="Cliquez sur un bloc du canvas pour voir et modifier ses propriétés"
        />
    );
}

export function NoBlocksFound() {
    return (
        <EmptyState
            icon={Search}
            title="Aucun bloc trouvé"
            description="Essayez une autre recherche"
            size="sm"
        />
    );
}

export function EmptyCanvas({ onAddBlock }: { onAddBlock?: () => void }) {
    return (
        <EmptyState
            icon={Layers}
            title="Canvas vide"
            description="Glissez un bloc depuis la palette ou cliquez pour commencer"
            action={onAddBlock ? { label: 'Ajouter un bloc', onClick: onAddBlock } : undefined}
        />
    );
}

export default EmptyState;
