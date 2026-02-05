'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive' | 'warning';
    onConfirm: () => void;
    onCancel?: () => void;
}

const VARIANT_STYLES = {
    default: {
        icon: Info,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-50',
        buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    },
    destructive: {
        icon: Trash2,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-50',
        buttonClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-50',
        buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    },
};

/**
 * Custom confirmation dialog to replace native confirm().
 * Renders as a portal overlay with backdrop.
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDelete}
 *   onOpenChange={setShowDelete}
 *   title="Supprimer ce bloc ?"
 *   description="Cette action est irréversible."
 *   confirmLabel="Supprimer"
 *   variant="destructive"
 *   onConfirm={() => handleDelete()}
 * />
 * ```
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const styles = VARIANT_STYLES[variant];
    const Icon = styles.icon;

    // Handle Escape key
    useEffect(() => {
        if (!open) return;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false);
                onCancel?.();
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onOpenChange, onCancel]);

    // Focus trap
    useEffect(() => {
        if (open && dialogRef.current) {
            const firstButton = dialogRef.current.querySelector('button');
            firstButton?.focus();
        }
    }, [open]);

    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    if (!open) return null;

    const dialog = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleBackdropClick}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl 
                           animate-in zoom-in-95 fade-in duration-200"
            >
                {/* Close button */}
                <button
                    onClick={handleCancel}
                    className="absolute top-3 right-3 p-1.5 rounded-full text-neutral-400 
                               hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    aria-label="Fermer"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-full ${styles.iconBg} ${styles.iconColor} flex-shrink-0`}>
                            <Icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2
                                id="confirm-dialog-title"
                                className="text-lg font-semibold text-neutral-900"
                            >
                                {title}
                            </h2>
                            {description && (
                                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 
                                       hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none 
                                       focus:ring-2 focus:ring-neutral-300"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors 
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.buttonClass}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render as portal to ensure it's above everything
    if (typeof window !== 'undefined') {
        return createPortal(dialog, document.body);
    }

    return null;
}

export default ConfirmDialog;
