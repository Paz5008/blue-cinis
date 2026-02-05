"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export type ViewportSize = 'mobile' | 'tablet' | 'desktop';

export interface ViewportConfig {
    name: string;
    width: number;
    icon: string;
}

export const VIEWPORT_PRESETS: Record<ViewportSize, ViewportConfig> = {
    mobile: { name: 'Mobile', width: 375, icon: '📱' },
    tablet: { name: 'Tablette', width: 768, icon: '📱' },
    desktop: { name: 'Desktop', width: 1200, icon: '🖥️' },
};

interface ResponsiveToggleProps {
    value: ViewportSize;
    onChange: (size: ViewportSize) => void;
    className?: string;
}

export function ResponsiveToggle({ value, onChange, className }: ResponsiveToggleProps) {
    const sizes: ViewportSize[] = ['mobile', 'tablet', 'desktop'];

    return (
        <div className={cn("flex items-center gap-1 bg-neutral-100 rounded-lg p-1", className)}>
            {sizes.map((size) => {
                const config = VIEWPORT_PRESETS[size];
                const isActive = value === size;

                return (
                    <button
                        key={size}
                        onClick={() => onChange(size)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            isActive
                                ? "bg-white text-neutral-900 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
                        )}
                        title={`${config.name} (${config.width}px)`}
                    >
                        <span>{config.icon}</span>
                        <span className="hidden sm:inline">{config.name}</span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Hook pour gérer l'état du viewport responsive
 */
export function useResponsivePreview(defaultSize: ViewportSize = 'desktop') {
    const [viewportSize, setViewportSize] = React.useState<ViewportSize>(defaultSize);

    const currentConfig = VIEWPORT_PRESETS[viewportSize];

    return {
        viewportSize,
        setViewportSize,
        width: currentConfig.width,
        isMobile: viewportSize === 'mobile',
        isTablet: viewportSize === 'tablet',
        isDesktop: viewportSize === 'desktop',
    };
}
