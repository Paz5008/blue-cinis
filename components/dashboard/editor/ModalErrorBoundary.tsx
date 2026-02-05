'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onClose?: () => void;
    modalTitle?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary pour les modales de l'éditeur (templates, artwork, ALT guard, etc.).
 * Offre une option de fermeture en plus du retry.
 */
export class ModalErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ModalErrorBoundary] Erreur capturée:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    handleClose = () => {
        this.setState({ hasError: false, error: undefined });
        this.props.onClose?.();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
                    <div className="w-12 h-12 mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>

                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">
                        {this.props.modalTitle
                            ? `Erreur: ${this.props.modalTitle}`
                            : 'Erreur dans la fenêtre'}
                    </h3>

                    <p className="text-sm text-neutral-600 mb-4 text-center">
                        Une erreur s'est produite. Vous pouvez réessayer ou fermer cette fenêtre.
                    </p>

                    {this.state.error && (
                        <details className="w-full mb-4 p-3 bg-neutral-50 rounded-lg">
                            <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-700">
                                Détails de l'erreur
                            </summary>
                            <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-24">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}

                    <div className="flex gap-3">
                        {this.props.onClose && (
                            <button
                                onClick={this.handleClose}
                                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-colors"
                                aria-label="Fermer la fenêtre"
                            >
                                Fermer
                            </button>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            aria-label="Réessayer"
                        >
                            <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Réessayer
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ModalErrorBoundary;
