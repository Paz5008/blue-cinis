'use client';

/**
 * NOTE: 3D model file /models/artwork-frame.glb is required for this feature.
 * This component is currently disabled as a placeholder until the GLB file is created.
 * Future work: Create 3D model and integrate with Three.js/@react-three/fiber
 */

interface ViewInRoomSectionProps {
    artworkImageUrl: string;
    artworkTitle: string;
    dimensions?: { width?: number; height?: number; unit?: string };
}

/**
 * Placeholder for ViewInRoom AR feature
 * Disabled until 3D model assets are available
 */
export function ViewInRoomSection({
    artworkImageUrl,
    artworkTitle,
    dimensions
}: ViewInRoomSectionProps) {
    // Return null for now - enable when GLB model is ready
    return null;
}

export default ViewInRoomSection;
