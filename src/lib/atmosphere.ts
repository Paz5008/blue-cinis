
import { FastAverageColor } from 'fast-average-color';

// Instance globale pour éviter de la recréer à chaque fois
const fac = new FastAverageColor();

/**
 * Analyse une image et détecte sa couleur dominante.
 * Retourne une chaîne hexadécimale (ex: #1a1a1a) ou null en cas d'échec.
 */
export async function extractAtmosphere(imageUrl: string): Promise<string | null> {
    if (!imageUrl) return null;

    try {
        const result = await fac.getColorAsync(imageUrl, {
            algorithm: 'dominant', // ou 'simple' pour la moyenne
            ignoredColor: [
                [255, 255, 255, 255], // Ignorer le blanc pur
                [0, 0, 0, 255]        // Ignorer le noir pur
            ]
        });
        return result.hex;
    } catch (error) {
        console.warn('Atmosphere Extraction Failed:', error);
        return null;
    }
}

/**
 * Détermine si le texte doit être blanc ou noir en fonction du fond.
 * @param hexColor Couleur de fond (ex: #1a1a1a)
 * @returns '#FFFFFF' ou '#000000'
 */
export function getTextColorForBackground(hexColor: string): string {
    if (!hexColor) return '#000000'; // Fallback

    // Conversion hex -> rgb
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Formule de la luminosité perçue (YIQ)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Si sombre (< 128), texte blanc. Sinon noir.
    return (yiq < 128) ? '#FFFFFF' : '#000000';
}
