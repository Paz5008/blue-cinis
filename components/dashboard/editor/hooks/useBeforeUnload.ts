import { useEffect } from 'react';

/**
 * Hook pour avertir l'utilisateur avant de quitter la page
 * si des modifications non sauvegardées existent.
 * 
 * @param isDirty - Indique si des modifications non sauvegardées existent
 * @param message - Message custom (ignoré par la plupart des navigateurs modernes)
 * 
 * @example
 * ```tsx
 * const { isDirty } = useEditorBlocks(...);
 * useBeforeUnload(isDirty);
 * ```
 */
export const useBeforeUnload = (isDirty: boolean, message?: string) => {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;

            // Les navigateurs modernes ignorent le message custom
            // mais on le définit quand même pour les anciens navigateurs
            const defaultMessage = message || 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';

            e.preventDefault();
            e.returnValue = defaultMessage;
            return defaultMessage;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty, message]);
};
