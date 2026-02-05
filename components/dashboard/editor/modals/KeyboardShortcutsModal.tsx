'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Keyboard } from 'lucide-react';

interface ShortcutItem {
    keys: string[];
    label: string;
}

interface ShortcutSection {
    category: string;
    items: ShortcutItem[];
}

const SHORTCUTS: ShortcutSection[] = [
    {
        category: 'Édition',
        items: [
            { keys: ['⌘', 'S'], label: 'Sauvegarder' },
            { keys: ['⌘', 'Z'], label: 'Annuler' },
            { keys: ['⌘', '⇧', 'Z'], label: 'Rétablir' },
            { keys: ['⌘', 'Y'], label: 'Rétablir (alt)' },
            { keys: ['Suppr'], label: 'Supprimer le bloc' },
            { keys: ['Backspace'], label: 'Supprimer le bloc' },
        ],
    },
    {
        category: 'Navigation',
        items: [
            { keys: ['↑'], label: 'Bloc précédent' },
            { keys: ['↓'], label: 'Bloc suivant' },
            { keys: ['Tab'], label: 'Champ suivant' },
            { keys: ['⇧', 'Tab'], label: 'Champ précédent' },
            { keys: ['Échap'], label: 'Fermer panel/modal' },
        ],
    },
    {
        category: 'Vue',
        items: [
            { keys: ['⌘', 'P'], label: 'Mode aperçu' },
            { keys: ['?'], label: 'Afficher cette aide' },
        ],
    },
];

interface KeyboardShortcutsModalProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Modal displaying all keyboard shortcuts available in the editor.
 * Accessible via the "?" key shortcut.
 */
export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
    // Handle Escape key
    useEffect(() => {
        if (!open) return;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!open) return null;

    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleBackdropClick}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-neutral-100 text-neutral-600">
                            <Keyboard size={20} />
                        </div>
                        <h2 id="shortcuts-title" className="text-lg font-semibold text-neutral-900">
                            Raccourcis clavier
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                        aria-label="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {SHORTCUTS.map((section) => (
                        <div key={section.category}>
                            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.items.map((shortcut, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-1.5"
                                    >
                                        <span className="text-sm text-neutral-700">
                                            {shortcut.label}
                                        </span>
                                        <div className="flex gap-1">
                                            {shortcut.keys.map((key, j) => (
                                                <kbd
                                                    key={j}
                                                    className="inline-flex items-center justify-center min-w-[24px] px-2 py-1 text-xs font-mono 
                                                               bg-neutral-100 border border-neutral-200 rounded shadow-sm text-neutral-600"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100">
                    <p className="text-xs text-neutral-500 text-center">
                        Appuyez sur <kbd className="px-1.5 py-0.5 bg-neutral-200 rounded text-[10px] font-mono mx-1">?</kbd> pour afficher cette aide à tout moment
                    </p>
                </div>
            </div>
        </div>
    );

    if (typeof window !== 'undefined') {
        return createPortal(modal, document.body);
    }

    return null;
}

export default KeyboardShortcutsModal;
