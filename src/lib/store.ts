import { create } from 'zustand'

interface AppState {
    activeArtworkId: string | null
    activeArtworkIndex: number
    isTransitioning: boolean
    isLoaded: boolean
    introFinished: boolean
    activeSectionTitle: string | null
    setActiveArtworkId: (id: string | null) => void
    setActiveArtworkIndex: (index: number) => void
    setIsTransitioning: (isTransitioning: boolean) => void
    setIsLoaded: (isLoaded: boolean) => void
    setIntroFinished: (introFinished: boolean) => void
    setActiveSectionTitle: (title: string | null) => void
    isMenuOpen: boolean;
    setMenuOpen: (isOpen: boolean) => void;
    menuView: 'nav' | 'login';
    setMenuView: (view: 'nav' | 'login') => void;
}

export const useStore = create<AppState>((set) => ({
    activeArtworkId: null,
    activeArtworkIndex: 0,
    isTransitioning: false,
    isLoaded: false,
    introFinished: false,
    activeSectionTitle: null,
    setActiveArtworkId: (id) => set({ activeArtworkId: id }),
    setActiveArtworkIndex: (index) => set({ activeArtworkIndex: index }),
    setIsTransitioning: (isTransitioning) => set({ isTransitioning }),
    setIsLoaded: (isLoaded) => set({ isLoaded }),
    setIntroFinished: (introFinished) => set({ introFinished }),
    setActiveSectionTitle: (title) => set({ activeSectionTitle: title }),
    isMenuOpen: false,
    setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
    menuView: 'nav',
    setMenuView: (view) => set({ menuView: view }),
}))
