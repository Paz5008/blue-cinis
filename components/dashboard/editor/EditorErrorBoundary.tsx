'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { editorLogger } from '@/lib/logger';

interface Props {
    children: ReactNode;
    fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary pour l'éditeur CMS.
 * Capture les erreurs React et affiche un fallback UI gracieux.
 * 
 * @example
 * ```tsx
 * <EditorErrorBoundary>
 *   <Editor {...props} />
 * </EditorErrorBoundary>
 * ```
 */
export class EditorErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        editorLogger.error({ err: error, componentStack: errorInfo.componentStack }, 'Editor Error Boundary caught error');

        this.setState({ errorInfo });

        // Send to Sentry for production monitoring
        Sentry.captureException(error, {
            extra: { componentStack: errorInfo.componentStack },
            tags: { component: 'EditorErrorBoundary' },
        });
    }

    reset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            // Custom fallback si fourni
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.reset);
            }

            // Fallback par défaut
            return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
        }

        return this.props.children;
    }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="max-w-2xl w-full bg-white shadow-2xl rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-red-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8" />
                        <div>
                            <h2 className="text-2xl font-bold">Erreur de l&apos;Éditeur</h2>
                            <p className="text-red-100 text-sm mt-1">
                                Une erreur inattendue s&apos;est produite
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        Ne vous inquiétez pas, vos données sont <strong>sauvegardées automatiquement</strong>.
                        Essayez de recharger l&apos;éditeur en cliquant sur le bouton ci-dessous.
                    </p>

                    {/* Error details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Détails techniques :</h3>
                        <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                            {error.message}
                        </pre>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Réessayer
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Recharger la page
                        </button>
                    </div>

                    {/* Support */}
                    <p className="text-sm text-gray-500 mt-6 text-center">
                        Si le problème persiste, contactez le support avec le code d&apos;erreur ci-dessus.
                    </p>
                </div>
            </div>
        </div>
    );
}
