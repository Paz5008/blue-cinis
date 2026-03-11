
/**
 * Maps friendly font names to safe CSS font-family stacks
 */
export const resolveFontFamily = (name?: string): string | undefined => {
    if (!name) return undefined;
    const key = String(name).toLowerCase().trim();
    if (key === 'inter') return "var(--font-inter), Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    if (key === 'poppins') return "var(--font-poppins), Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    if (key === 'playfair display') return "var(--font-playfair), 'Playfair Display', Georgia, 'Times New Roman', serif";
    if (key === 'montserrat') return "var(--font-montserrat), Montserrat, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    if (key === 'serif' || key === 'sans-serif' || key === 'monospace') return name;
    return name;
};

/**
 * Font options for typography controls
 */
export const FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans-serif' },
    { value: 'monospace', label: 'Monospace' },
] as const;
