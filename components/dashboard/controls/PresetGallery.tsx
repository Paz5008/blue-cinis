import React from 'react';
import type { BlockPreset } from '@/lib/presets';
import type { BlockStyle } from '@/types/cms';
import { cn } from '@/lib/utils'; // Assuming typical cn utility exists, or I will use template literals

interface PresetGalleryProps {
    presets: BlockPreset[];
    onSelect: (style: Partial<BlockStyle>) => void;
    className?: string;
}

export function PresetGallery({ presets, onSelect, className }: PresetGalleryProps) {
    if (!presets || presets.length === 0) return null;

    return (
        <div className={cn("grid grid-cols-2 gap-3", className)}>
            {presets.map((preset) => (
                <button
                    key={preset.id}
                    onClick={() => onSelect(preset.style)}
                    className="group relative flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-400"
                    title={preset.label}
                    type="button"
                >
                    {/* Visual Preview Area */}
                    <div className="mb-3 flex h-16 w-full items-center justify-center overflow-hidden rounded bg-neutral-50 p-2 dark:bg-neutral-800">
                        {preset.icon ? (
                            <div className="text-neutral-500 group-hover:text-blue-500 dark:text-neutral-400">
                                {preset.icon}
                            </div>
                        ) : (
                            /* Attempt a mini-render of the style */
                            <div
                                className="h-full w-full flex items-center justify-center text-[10px] overflow-hidden leading-tight"
                                style={{
                                    ...preset.style as any,
                                    // Override layout props that might break the preview
                                    width: undefined,
                                    height: undefined,
                                    position: undefined,
                                    margin: undefined,
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    // Ensure visibility
                                    backgroundColor: preset.style.backgroundColor || 'transparent',
                                    color: preset.style.color || 'currentColor',
                                    borderColor: (preset.style as any).borderColor || 'currentColor',
                                }}
                            >
                                <span className="opacity-80">Abc</span>
                            </div>
                        )}
                    </div>

                    {/* Label */}
                    <span className="text-xs font-medium text-neutral-700 group-hover:text-blue-600 dark:text-neutral-300 dark:group-hover:text-blue-400">
                        {preset.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

// Fallback if cn is not available, though likely is in standard shadcn/tailwind setup
// If compilation fails on cn, I will replace with simple string join.
