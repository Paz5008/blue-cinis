
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, ShieldCheck, Maximize2 } from 'lucide-react';
import OpenSeadragon from 'openseadragon';

interface DeepZoomViewerProps {
    src: string;
    alt: string;
    thumbnailUrl?: string;
    className?: string;
    /** Enable the navigator mini-map (default: true) */
    enableNavigator?: boolean;
    /** Maximum zoom level (default: 10) */
    maxZoomLevel?: number;
}

/**
 * DeepZoomViewer - High-resolution image viewer with pan and zoom
 * Uses OpenSeadragon for smooth zooming on desktop and mobile with pinch-to-zoom
 */
export const DeepZoomViewer: React.FC<DeepZoomViewerProps> = ({
    src,
    alt,
    thumbnailUrl,
    className = '',
    enableNavigator = true,
    maxZoomLevel = 10,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);

    useEffect(() => setIsMounted(true), []);

    const displayThumb = thumbnailUrl || src;

    const toggleZoom = useCallback(() => setIsOpen(prev => !prev), []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Initialize OpenSeadragon when modal opens
    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        setIsLoading(true);

        // Small delay to let the container mount
        const initTimer = setTimeout(() => {
            if (!containerRef.current) return;

            try {
                const viewer = OpenSeadragon({
                    element: containerRef.current,
                    tileSources: {
                        type: 'image',
                        url: src,
                    },
                    showNavigator: enableNavigator,
                    navigatorPosition: 'BOTTOM_RIGHT',
                    navigatorHeight: '100px',
                    navigatorWidth: '150px',
                    navigatorAutoFade: true,
                    visibilityRatio: 0.9,
                    minZoomLevel: 0.5,
                    maxZoomLevel: maxZoomLevel,
                    constrainDuringPan: true,
                    gestureSettingsTouch: {
                        pinchToZoom: true,
                        scrollToZoom: false,
                        clickToZoom: true,
                        dblClickToZoom: true,
                        flickEnabled: true,
                    },
                    gestureSettingsMouse: {
                        scrollToZoom: true,
                        clickToZoom: false,
                        dblClickToZoom: true,
                    },
                    showNavigationControl: false, // We'll use custom controls
                    animationTime: 0.4,
                    springStiffness: 12,
                    immediateRender: true,
                });

                viewer.addHandler('open', () => {
                    setIsLoading(false);
                });

                viewer.addHandler('open-failed', () => {
                    setIsLoading(false);
                });

                viewerRef.current = viewer;
            } catch {
                setIsLoading(false);
            }
        }, 100);

        return () => {
            clearTimeout(initTimer);
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [isOpen, src, enableNavigator, maxZoomLevel]);

    // Custom zoom controls
    const handleZoomIn = useCallback(() => {
        if (viewerRef.current) {
            const currentZoom = viewerRef.current.viewport.getZoom();
            viewerRef.current.viewport.zoomTo(currentZoom * 1.5);
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        if (viewerRef.current) {
            const currentZoom = viewerRef.current.viewport.getZoom();
            viewerRef.current.viewport.zoomTo(currentZoom / 1.5);
        }
    }, []);

    const handleReset = useCallback(() => {
        if (viewerRef.current) {
            viewerRef.current.viewport.goHome();
        }
    }, []);

    return (
        <>
            {/* Thumbnail Trigger */}
            <div
                className={`relative group cursor-zoom-in overflow-hidden rounded-lg ${className}`}
                onClick={toggleZoom}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleZoom(); }}
                aria-label={`Voir ${alt} en haute résolution`}
            >
                <img
                    src={displayThumb}
                    alt={alt}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    width={800}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                    <Maximize2 size={14} />
                    <span className="hidden sm:inline">Inspecter en détail</span>
                    <span className="sm:hidden">Zoom</span>
                </div>
            </div>

            {/* Full Screen Deep Zoom Modal */}
            {isMounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-[9999] bg-neutral-950 flex items-center justify-center"
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Vue détaillée de ${alt}`}
                        >
                            {/* Loading overlay */}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span className="text-sm text-white/70">Chargement haute résolution...</span>
                                    </div>
                                </div>
                            )}

                            {/* OpenSeadragon Container */}
                            <div
                                ref={containerRef}
                                className="w-full h-full"
                                style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s' }}
                            />

                            {/* Control Bar */}
                            <m.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-2 py-1.5 bg-black/70 backdrop-blur-sm rounded-full"
                            >
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
                                    aria-label="Zoom avant"
                                >
                                    <ZoomIn size={20} />
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
                                    aria-label="Zoom arrière"
                                >
                                    <ZoomOut size={20} />
                                </button>
                                <div className="w-px h-5 bg-white/20" />
                                <button
                                    onClick={handleReset}
                                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
                                    aria-label="Réinitialiser la vue"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            </m.div>

                            {/* Close Button */}
                            <button
                                onClick={toggleZoom}
                                className="fixed top-4 right-4 z-50 p-2.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition"
                                aria-label="Fermer"
                            >
                                <X size={22} />
                            </button>

                            {/* Trust Badge */}
                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full"
                            >
                                <ShieldCheck size={16} className="text-emerald-400" />
                                <span className="text-sm font-medium">Authenticité garantie</span>
                            </m.div>

                            {/* Zoom Hint */}
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="fixed bottom-6 right-6 z-40 text-xs text-white/50"
                            >
                                <span className="hidden md:inline">Molette pour zoomer • Cliquer-glisser pour déplacer</span>
                                <span className="md:hidden">Pincez pour zoomer</span>
                            </m.div>
                        </m.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
