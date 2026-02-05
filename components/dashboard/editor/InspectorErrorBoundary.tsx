'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary pour le panneau inspecteur latéral.
 * Affiche un fallback compact adapté à la largeur du panneau.
 */
export class InspectorErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[InspectorErrorBoundary] Erreur capturée:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center p-4 bg-amber-50 border border-amber-200 rounded-lg m-2">
                    <div className="w-8 h-8 mb-3 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-4 h-4 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h4 className="text-sm font-medium text-neutral-900 mb-1 text-center">
                        Erreur de l'inspecteur
                    </h4>

                    <p className="text-xs text-neutral-600 mb-3 text-center">
                        Impossible de charger les options du bloc.
                    </p>

                    <button
                        onClick={this.handleReset}
                        className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                        aria-label="Réessayer le chargement de l'inspecteur"
                    >
                        Réessayer
                    </button>

                    {this.state.error && (
                        <details className="w-full mt-3 text-left">
                            <summary className="text-xs text-neutral-400 cursor-pointer">
                                Voir l'erreur
                            </summary>
                            <pre className="mt-1 text-xs text-red-500 break-all whitespace-pre-wrap">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default InspectorErrorBoundary;
