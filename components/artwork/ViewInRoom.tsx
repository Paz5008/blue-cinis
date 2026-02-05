'use client';

import '@google/model-viewer';
import { useState, useEffect } from 'react';

// Augmenter les types pour model-viewer
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    src?: string;
                    ar?: boolean;
                    'ar-modes'?: string;
                    'camera-controls'?: boolean;
                    poster?: string;
                    alt?: string;
                    'environment-image'?: string;
                    'shadow-intensity'?: string;
                    exposure?: string;
                },
                HTMLElement
            >;
        }
    }
}

/**
 * Props pour le composant ViewInRoom
 */
interface ViewInRoomProps {
    /** URL de l'image de l'œuvre */
    artworkImageUrl: string;
    /** Titre de l'œuvre (utilisé pour l'accessibilité) */
    artworkTitle: string;
    /** Dimensions de l'œuvre */
    dimensions?: { width?: number; height?: number; unit?: string };
    /** URL optionnelle du modèle 3D GLB */
    glbModelUrl?: string;
}

/**
 * ViewInRoom - Composant de réalité augmentée pour visualiser les œuvres
 * 
 * Permet aux utilisateurs de visualiser une œuvre dans leur espace réel.
 * Supporte deux modes :
 * - **Mode GLB** : Utilise model-viewer avec un modèle 3D
 * - **Mode iOS Quick Look** : Fallback natif pour iPhone/iPad sans modèle 3D
 * 
 * @example
 * ```tsx
 * <ViewInRoom
 *   artworkImageUrl="/images/artwork.jpg"
 *   artworkTitle="Composition abstraite"
 *   dimensions={{ width: 80, height: 60, unit: 'cm' }}
 * />
 * ```
 */
export function ViewInRoom({
    artworkImageUrl,
    artworkTitle,
    dimensions,
    glbModelUrl
}: ViewInRoomProps) {
    const [isClient, setIsClient] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [hasGLB, setHasGLB] = useState(false);

    useEffect(() => {
        setIsClient(true);

        // Detect iOS device
        if (typeof navigator !== 'undefined') {
            const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
            setIsIOS(iosDevice);
        }

        // Check if GLB model exists
        const modelUrl = glbModelUrl || '/models/artwork-frame.glb';
        fetch(modelUrl, { method: 'HEAD' })
            .then(res => setHasGLB(res.ok))
            .catch(() => setHasGLB(false));
    }, [glbModelUrl]);

    const arModelUrl = glbModelUrl || '/models/artwork-frame.glb';

    // Loading state
    if (!isClient) {
        return (
            <div
                className="view-in-room-loading"
                style={{
                    width: '100%',
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-surface-secondary, #1a1a1a)',
                    borderRadius: '12px'
                }}
                aria-label="Chargement de la vue AR"
            >
                <span style={{ color: 'var(--color-text-secondary, #888)' }}>
                    Chargement AR...
                </span>
            </div>
        );
    }

    // iOS Quick Look Fallback (when no GLB available)
    if (isIOS && !hasGLB) {
        return (
            <div className="view-in-room view-in-room--ios-fallback" style={{ position: 'relative' }}>
                {/* iOS AR Quick Look link */}
                <a
                    rel="ar"
                    href={artworkImageUrl}
                    style={{
                        display: 'block',
                        width: '100%',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        textDecoration: 'none'
                    }}
                    aria-label={`Voir ${artworkTitle} en réalité augmentée`}
                >
                    {/* Preview Image */}
                    <div
                        style={{
                            width: '100%',
                            height: '400px',
                            backgroundImage: `url(${artworkImageUrl})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: 'var(--color-surface-secondary, #1a1a1a)',
                            borderRadius: '12px',
                            position: 'relative'
                        }}
                    >
                        {/* AR Button Overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '16px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                padding: '12px 24px',
                                backgroundColor: 'var(--color-primary, #3b82f6)',
                                color: 'white',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                        >
                            <span role="img" aria-hidden="true">📱</span>
                            Voir dans votre pièce
                        </div>
                    </div>
                </a>

                {/* iOS Quick Look Info */}
                <p
                    style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        backgroundColor: 'var(--color-surface-tertiary, #2a2a2a)',
                        borderRadius: '8px',
                        color: 'var(--color-text-secondary, #888)',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}
                >
                    📲 Sur iPhone, l&apos;image s&apos;ouvrira en AR automatiquement.
                    Pointez votre caméra vers un mur pour visualiser l&apos;œuvre.
                </p>

                {dimensions && (dimensions.width || dimensions.height) && (
                    <p
                        style={{
                            marginTop: '8px',
                            color: 'var(--color-text-tertiary, #666)',
                            fontSize: '12px',
                            textAlign: 'center'
                        }}
                    >
                        Dimensions réelles : {dimensions.width && `${dimensions.width}`}
                        {dimensions.width && dimensions.height && ' × '}
                        {dimensions.height && `${dimensions.height}`}
                        {dimensions.unit && ` ${dimensions.unit}`}
                    </p>
                )}
            </div>
        );
    }

    // Full Model Viewer (with GLB)
    return (
        <div className="view-in-room" style={{ position: 'relative' }}>
            <model-viewer
                src={arModelUrl}
                ar
                ar-modes="scene-viewer webxr quick-look"
                camera-controls
                poster={artworkImageUrl}
                alt={`Vue AR de ${artworkTitle}`}
                environment-image="neutral"
                shadow-intensity="1"
                exposure="1"
                style={{
                    width: '100%',
                    height: '400px',
                    backgroundColor: 'var(--color-surface-secondary, #1a1a1a)',
                    borderRadius: '12px'
                }}
            >
                <button
                    slot="ar-button"
                    className="ar-button"
                    aria-label="Voir dans votre pièce"
                    style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '12px 24px',
                        backgroundColor: 'var(--color-primary, #3b82f6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    <span role="img" aria-hidden="true">📱</span>
                    Voir dans votre pièce
                </button>
            </model-viewer>

            {/* iOS without GLB fallback hint */}
            {isIOS && !hasGLB && (
                <p
                    style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        backgroundColor: 'var(--color-surface-tertiary, #2a2a2a)',
                        borderRadius: '8px',
                        color: 'var(--color-text-secondary, #888)',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}
                >
                    L&apos;AR n&apos;est pas supporté sur votre appareil.
                    Essayez depuis un smartphone récent (iOS 12+ ou Android 8+).
                </p>
            )}

            {dimensions && (dimensions.width || dimensions.height) && (
                <p
                    style={{
                        marginTop: '8px',
                        color: 'var(--color-text-tertiary, #666)',
                        fontSize: '12px',
                        textAlign: 'center'
                    }}
                >
                    Dimensions réelles : {dimensions.width && `${dimensions.width}`}
                    {dimensions.width && dimensions.height && ' × '}
                    {dimensions.height && `${dimensions.height}`}
                    {dimensions.unit && ` ${dimensions.unit}`}
                </p>
            )}
        </div>
    );
}

export default ViewInRoom;
