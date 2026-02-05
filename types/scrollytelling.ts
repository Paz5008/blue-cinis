export interface ScrollAnimationConfig {
    // Trigger properties
    triggerStart?: string; // e.g. "top bottom"
    triggerEnd?: string;   // e.g. "center center"
    scrub?: boolean | number;

    // Animation properties
    from?: {
        x?: number; y?: number; z?: number;
        rotationX?: number; rotationY?: number; rotationZ?: number;
        scale?: number;
        opacity?: number;
    };
    to?: {
        x?: number; y?: number; z?: number;
        rotationX?: number; rotationY?: number; rotationZ?: number;
        scale?: number; // Target scale or additional scale
    };

    // Behavior
    scrollSpeed?: number; // Parallax factor (multiplier)
    rotationIntensity?: number; // Multiplier for rotation on scroll
}

export interface AdvancedLayoutItem {
    id: string; // Block ID
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    rotation: number; // Base Z rotation
    scale: number;

    // New Animation Config
    animation?: ScrollAnimationConfig;
}
