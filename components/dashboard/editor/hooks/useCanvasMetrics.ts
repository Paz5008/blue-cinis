import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BANNER_DESIGN_WIDTH, BANNER_DESIGN_HEIGHT, BANNER_DESIGN_HEIGHT_MOBILE } from '../useEditorBanner';
import { DESIGN_DIMENSIONS } from '../constants';

interface CanvasMetrics {
    scrollWidth: number;
    clientWidth: number;
    scrollHeight: number;
    clientHeight: number;
}

interface UseCanvasMetricsProps {
    isBanner: boolean;
    isPoster: boolean;
    device: 'desktop' | 'mobile';
    blocks: readonly { id: string }[];
    theme: unknown;
    viewMode: string;
    isCanvasDragOver: boolean;
}

interface UseCanvasMetricsReturn {
    canvasRef: React.RefObject<HTMLDivElement>;
    canvasContentRef: React.RefObject<HTMLDivElement>;
    canvasMetrics: CanvasMetrics;
    dimensionErrors: string[];
    hasDimensionError: boolean;
    canvasFrameClassName: string;
    canvasMainClassName: string;
    canvasFormatLabelDesktop: string | null;
    canvasFormatLabelMobile: string | null;
    canvasWidth: number | undefined;
    setCanvasWidth: (width: number | undefined) => void;
    startResizing: (e: React.MouseEvent) => void;
}

/**
 * Hook to manage canvas metrics, dimension errors, and dynamic class names.
 * Extracted from Editor.tsx to reduce component complexity.
 */
export function useCanvasMetrics({
    isBanner,
    isPoster,
    device,
    blocks,
    theme,
    viewMode,
    isCanvasDragOver,
}: UseCanvasMetricsProps): UseCanvasMetricsReturn {
    const canvasRef = useRef<HTMLDivElement>(null!);
    const canvasContentRef = useRef<HTMLDivElement>(null!);

    const [canvasWidth, setCanvasWidth] = useState<number | undefined>(undefined);
    const [canvasMetrics, setCanvasMetrics] = useState<CanvasMetrics>({
        scrollWidth: 0,
        clientWidth: 0,
        scrollHeight: 0,
        clientHeight: 0,
    });
    const [dimensionErrors, setDimensionErrors] = useState<string[]>([]);

    const { mobilePreviewWidth, poster: posterDims } = DESIGN_DIMENSIONS;
    const posterDesignWidth = posterDims.width;
    const posterDesignHeight = posterDims.height;
    const posterDesignHeightMobile = posterDims.heightMobile;

    const hasDimensionError = dimensionErrors.length > 0;

    // Canvas frame class name
    const canvasFrameClassName = useMemo(() => {
        if (!(isPoster || isBanner)) return 'relative mx-auto h-full';
        if (isBanner) {
            const errorRing = hasDimensionError ? 'ring-2 ring-red-500/60' : '';
            return [
                'relative mx-auto w-full max-w-[1280px] rounded-[32px] overflow-hidden',
                errorRing,
            ]
                .filter(Boolean)
                .join(' ')
                .trim();
        }
        const borderClass = hasDimensionError
            ? 'border-red-500/50 ring-2 ring-red-500/20'
            : '';
        return `relative mx-auto rounded-xl ${borderClass} overflow-hidden shadow-sm`;
    }, [hasDimensionError, isBanner, isPoster]);

    // Canvas main class name
    const canvasMainClassName = useMemo(() => {
        if (device === 'mobile') {
            if (isBanner) {
                return [
                    'w-full mx-auto overflow-visible bg-transparent p-0 transition-transform duration-500 ease-out',
                    isCanvasDragOver ? 'scale-[1.02]' : '',
                ]
                    .filter(Boolean)
                    .join(' ')
                    .trim();
            }
            return [
                `${isPoster ? '' : 'resize-x '}w-[390px] mx-auto overflow-auto rounded-[40px] border-[8px] border-neutral-900 bg-white shadow-2xl transition-all duration-500 ease-out`,
                isCanvasDragOver ? 'ring-4 ring-blue-500/50 scale-[1.01]' : 'ring-1 ring-white/10 ring-offset-0',
                'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
            ]
                .filter(Boolean)
                .join(' ')
                .trim();
        }
        if (isBanner) {
            return [
                'flex-1 w-full max-w-[1280px] mx-auto overflow-visible rounded-[36px] bg-transparent p-0 transition-all duration-500 ease-out supports-[backdrop-filter]:bg-transparent',
                isCanvasDragOver ? 'ring-2 ring-blue-400/70 scale-[1.005]' : '',
            ]
                .filter(Boolean)
                .join(' ')
                .trim();
        }
        return [
            `${isPoster ? '' : 'resize-x '}flex-1 w-full mx-auto overflow-auto rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-2xl transition-all duration-500 ease-out`,
            isCanvasDragOver ? 'ring-2 ring-blue-500/50 scale-[1.005]' : 'ring-1 ring-white/5',
            'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent',
        ]
            .filter(Boolean)
            .join(' ')
            .trim();
    }, [device, isBanner, isPoster, isCanvasDragOver]);

    // Format labels
    const canvasFormatLabelDesktop = useMemo(() => {
        if (isBanner) return `${BANNER_DESIGN_WIDTH} × ${BANNER_DESIGN_HEIGHT} px`;
        if (isPoster) return `${posterDesignWidth} × ${posterDesignHeight} px`;
        return null;
    }, [isBanner, isPoster, posterDesignWidth, posterDesignHeight]);

    const canvasFormatLabelMobile = useMemo(() => {
        if (isBanner) return `${mobilePreviewWidth} × ${BANNER_DESIGN_HEIGHT_MOBILE} px`;
        if (isPoster) return `${mobilePreviewWidth} × ${posterDesignHeightMobile} px`;
        return null;
    }, [isBanner, isPoster, mobilePreviewWidth, posterDesignHeightMobile]);

    // ResizeObserver for canvas metrics
    useEffect(() => {
        if (!canvasContentRef.current || !(isBanner || isPoster)) return;
        const node = canvasContentRef.current;
        const updateMetrics = () => {
            setCanvasMetrics({
                scrollWidth: node.scrollWidth,
                clientWidth: node.clientWidth,
                scrollHeight: node.scrollHeight,
                clientHeight: node.clientHeight,
            });
        };
        updateMetrics();
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        const observer = new ResizeObserver(() => updateMetrics());
        observer.observe(node);
        return () => observer.disconnect();
    }, [blocks, theme, viewMode, device, isBanner, isPoster]);

    // Dimension error detection
    useEffect(() => {
        if (!(isBanner || isPoster)) {
            if (dimensionErrors.length > 0) setDimensionErrors([]);
            return;
        }
        const tolerance = 1.5;
        const widthLimit = device === 'mobile' ? mobilePreviewWidth : (isBanner ? BANNER_DESIGN_WIDTH : posterDesignWidth);
        const heightLimit = device === 'mobile'
            ? (isBanner ? BANNER_DESIGN_HEIGHT_MOBILE : posterDesignHeightMobile)
            : (isBanner ? BANNER_DESIGN_HEIGHT : posterDesignHeight);
        const overflowWidth = Math.max(0, canvasMetrics.scrollWidth - canvasMetrics.clientWidth);
        const overflowHeight = Math.max(0, canvasMetrics.scrollHeight - canvasMetrics.clientHeight);
        const nextErrors: string[] = [];
        if (overflowWidth > tolerance) {
            nextErrors.push(`Le contenu dépasse la largeur autorisée (${widthLimit}px) de ${Math.round(overflowWidth)}px.`);
        }
        if (overflowHeight > tolerance) {
            nextErrors.push(`Le contenu dépasse la hauteur autorisée (${heightLimit}px) de ${Math.round(overflowHeight)}px.`);
        }
        setDimensionErrors(nextErrors);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasMetrics, isBanner, isPoster, device]);

    // Resizing handler
    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        document.body.style.cursor = 'col-resize';
        const startX = e.clientX;
        const startWidth = canvasRef.current?.offsetWidth || 0;
        const onMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth + (e.clientX - startX);
            setCanvasWidth(newWidth);
        };
        const onMouseUp = () => {
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, []);

    return {
        canvasRef,
        canvasContentRef,
        canvasMetrics,
        dimensionErrors,
        hasDimensionError,
        canvasFrameClassName,
        canvasMainClassName,
        canvasFormatLabelDesktop,
        canvasFormatLabelMobile,
        canvasWidth,
        setCanvasWidth,
        startResizing,
    };
}
