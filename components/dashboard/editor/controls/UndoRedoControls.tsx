"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface UndoRedoControlsProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    /** Optional: number of steps in undo history */
    undoCount?: number;
    /** Optional: number of steps in redo history */
    redoCount?: number;
    className?: string;
}

export function UndoRedoControls({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    undoCount,
    redoCount,
    className
}: UndoRedoControlsProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {/* Undo Button */}
            <button
                onClick={onUndo}
                disabled={!canUndo}
                className={cn(
                    "relative flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all",
                    canUndo
                        ? "text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
                        : "text-neutral-300 cursor-not-allowed"
                )}
                title={`Annuler${undoCount ? ` (${undoCount} étapes)` : ''} – ⌘Z`}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 10h10a5 5 0 0 1 5 5v2" />
                    <path d="M3 10l4-4" />
                    <path d="M3 10l4 4" />
                </svg>
                {undoCount !== undefined && undoCount > 0 && (
                    <span className="text-xs text-neutral-400">{undoCount}</span>
                )}
            </button>

            {/* Divider */}
            <div className="w-px h-4 bg-neutral-200" />

            {/* Redo Button */}
            <button
                onClick={onRedo}
                disabled={!canRedo}
                className={cn(
                    "relative flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all",
                    canRedo
                        ? "text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
                        : "text-neutral-300 cursor-not-allowed"
                )}
                title={`Rétablir${redoCount ? ` (${redoCount} étapes)` : ''} – ⌘⇧Z`}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10H11a5 5 0 0 0-5 5v2" />
                    <path d="M21 10l-4-4" />
                    <path d="M21 10l-4 4" />
                </svg>
                {redoCount !== undefined && redoCount > 0 && (
                    <span className="text-xs text-neutral-400">{redoCount}</span>
                )}
            </button>
        </div>
    );
}

/**
 * Keyboard shortcuts hook for undo/redo
 */
export function useUndoRedoKeyboard(
    onUndo: () => void,
    onRedo: () => void,
    enabled: boolean = true
) {
    React.useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;

            if (modifier && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    onRedo();
                } else {
                    onUndo();
                }
            }

            // Windows-style redo: Ctrl+Y
            if (!isMac && e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                onRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onUndo, onRedo, enabled]);
}
