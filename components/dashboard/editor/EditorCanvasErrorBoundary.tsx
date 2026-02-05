'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { editorLogger } from '@/lib/logger';

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
 * Error Boundary pour la zone de rendu canvas (Flow + FreeForm).
 * Capture les erreurs dans les composants enfants et affiche un fallback.
 */
export class EditorCanvasErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        editorLogger.error({ err: error, componentStack: errorInfo.componentStack }, 'Canvas Error Boundary caught error');
        this.props.onError?.(error, errorInfo);

        // Send to Sentry for production monitoring
        Sentry.captureException(error, {
            extra: { componentStack: errorInfo.componentStack },
            tags: { component: 'EditorCanvasErrorBoundary' },
        });
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
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <div className="text-center max-w-md">
                        <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
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
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                            Erreur dans le canvas
                        </h3>

                        <p className="text-sm text-neutral-600 mb-4">
                            Une erreur inattendue s'est produite lors du rendu du canvas.
                            Vos modifications récentes n'ont peut-être pas été sauvegardées.
                        </p>

                        {this.state.error && (
                            <details className="text-left mb-4 p-3 bg-neutral-100 rounded-lg">
                                <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-700">
                                    Détails techniques
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            aria-label="Réessayer le rendu du canvas"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
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

export default EditorCanvasErrorBoundary;
