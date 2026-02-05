"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { X, Menu as MenuIcon, ArrowRight, User, ShoppingBag, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { signIn, useSession, getSession } from "next-auth/react";

const MENU_ITEMS = [
    { label: "Galerie", href: "/galerie", image: "/uploads/artwork-portrait-01.png" },
    { label: "À Propos", href: "/a-propos", image: "/uploads/artwork-portrait-02.png" },
    { label: "Artistes", href: "/artistes", image: "/uploads/artwork-landscape-01.png" },
    { label: "Évènements", href: "/evenements", image: "https://picsum.photos/id/1025/1920/1080" },
    { label: "Contact", href: "/contact", image: "/uploads/banner-contact-bg.png" },
];

const slideVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] as const } },
    exit: { x: 100, opacity: 0, transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] as const } }
};

const loginSlideVariants = {
    hidden: { x: -50, opacity: 0 }, // Vient de la gauche
    visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] as const } }, // Pas de délai, enchaînement fluide grâce au mode='wait'
    exit: { x: 50, opacity: 0, transition: { duration: 0.3 } } // Part vers la droite
};

export default function Navigation() {
    const isMenuOpen = useStore((state) => state.isMenuOpen);
    const setMenuOpen = useStore((state) => state.setMenuOpen);
    const menuView = useStore((state) => state.menuView);
    const setMenuView = useStore((state) => state.setMenuView);

    const [hoveredImage, setHoveredImage] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Auth State
    const { data: session } = useSession();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset menu on page change
    useEffect(() => {
        setMenuOpen(false);
        // On attend la fermeture pour reset la vue
        setTimeout(() => setMenuView('nav'), 600);
    }, [pathname, setMenuOpen, setMenuView]);

    // Lock scroll
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isMenuOpen]);

    // Hide navigation toggle on CMS/Studio pages (component still renders for overlay)
    const hideToggle = pathname?.startsWith('/studio') || pathname?.startsWith('/admin') || pathname?.startsWith('/cms') || pathname?.startsWith('/dashboard-artist');

    // Return null only for pages that don't need the menu at all
    if (hideToggle) {
        return null;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Identifiants incorrects. Veuillez réessayer.");
            } else {
                setMenuOpen(false);
                router.refresh(); // Refresh to update auth state

                // Smart Redirect
                const currentSession = await getSession();
                const role = (currentSession?.user as any)?.role;

                if (role === 'artist') {
                    router.push("/dashboard-artist");
                } else if (role === 'admin') {
                    router.push("/admin");
                } else {
                    router.push("/compte");
                }
            }
        } catch {
            setError("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    const menuVariants = {
        closed: { y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const } },
        open: { y: "0%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const } },
    };

    const linkVariants = {
        closed: { y: "100%", opacity: 0 },
        open: (i: number) => ({
            y: "0%",
            opacity: 1,
            transition: { duration: 0.5, delay: 0.4 + i * 0.1, ease: [0.76, 0, 0.24, 1] as const }
        }),
    };

    // Animation pour la section Auth
    const authVariants = {
        closed: { opacity: 0, y: 20 },
        open: { opacity: 1, y: 0, transition: { delay: 0.8, duration: 0.5 } }
    };

    return (
        <>
            {/* BOUTON TOGGLE (Flottant & Magnétique) */}
            <button
                onClick={() => setMenuOpen(!isMenuOpen)}
                className="fixed top-8 right-8 z-50 group mix-blend-difference text-white"
                aria-label="Toggle Menu"
            >
                <div className="flex items-center gap-4 cursor-pointer">
                    <span className="text-xs font-mono tracking-[0.2em] uppercase hidden md:block group-hover:tracking-[0.3em] transition-all duration-300">
                        {isMenuOpen ? "Close" : "Menu"}
                    </span>
                    <div className="relative w-12 h-12 flex items-center justify-center rounded-full border border-white/20 group-hover:bg-white group-hover:text-black transition-all duration-300 backdrop-blur-sm">
                        <AnimatePresence mode="wait">
                            {isMenuOpen ? (
                                <X key="close" size={20} />
                            ) : (
                                <MenuIcon key="menu" size={20} />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </button>

            {/* OVERLAY PLEIN ÉCRAN */}
            <AnimatePresence>
                {isMenuOpen && (
                    <m.div
                        variants={menuVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="fixed inset-0 bg-[#050505] z-40 flex flex-col overflow-hidden"
                    >
                        {/* IMAGE GHOST EN BACKGROUND */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none grayscale transition-opacity duration-700 ease-in-out">
                            <AnimatePresence mode="wait">
                                {hoveredImage && menuView === 'nav' && (
                                    <m.div
                                        key={hoveredImage}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="absolute inset-0"
                                    >
                                        <Image src={hoveredImage} alt="Menu Preview" fill className="object-cover" />
                                    </m.div>
                                )}
                            </AnimatePresence>
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                        </div>

                        {/* CONTENU DYNAMIQUE (SLIDE) */}
                        <AnimatePresence mode="wait">
                            {menuView === 'nav' ? (
                                <m.div
                                    key="nav" // Clé unique pour Framer Motion
                                    variants={slideVariants}
                                    initial="hidden" // On peut start 'visible' car l'overlay fait l'anim d'entrée, mais pour le retour de login c'est mieux
                                    animate="visible"
                                    exit="exit"
                                    className="flex-1 flex flex-col w-full h-full"
                                >
                                    {/* CONTENU PRINCIPAL CENTRÉ : LIENS */}
                                    <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full">
                                        <nav className="flex flex-col items-center gap-2 md:gap-6">
                                            {MENU_ITEMS.map((item, i) => (
                                                <div key={item.label} className="overflow-hidden">
                                                    <m.div
                                                        custom={i}
                                                        variants={linkVariants}
                                                        initial="closed"
                                                        animate="open"
                                                        exit="closed"
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            onMouseEnter={() => setHoveredImage(item.image)}
                                                            onMouseLeave={() => setHoveredImage(null)}
                                                            className="group relative block text-center"
                                                        >
                                                            <span className="block font-grand-slang text-[12vw] md:text-[7vw] leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 group-hover:to-white transition-all duration-500 uppercase">
                                                                {item.label}
                                                            </span>
                                                            <span className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-300 text-blue-400">
                                                                <ArrowRight size={32} />
                                                            </span>
                                                        </Link>
                                                    </m.div>
                                                </div>
                                            ))}
                                        </nav>
                                    </div>

                                    {/* FOOTER AUTH */}
                                    <m.div
                                        variants={authVariants}
                                        initial="closed"
                                        animate="open"
                                        exit="closed"
                                        className="relative z-10 w-full border-t border-white/10 bg-black/20 backdrop-blur-md"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">

                                            {/* 1. ESPACE COLLECTIONNEUR */}
                                            <div className="p-8 flex flex-col gap-4 group hover:bg-white/5 transition-colors duration-500">
                                                <div className="flex items-center gap-3 text-white/60 mb-2">
                                                    <User size={18} />
                                                    <span className="font-mono text-xs tracking-[0.2em] uppercase">Collector</span>
                                                </div>
                                                <div className="flex gap-6">
                                                    {session ? (
                                                        <Link
                                                            href={
                                                                (session.user as any)?.role === 'artist'
                                                                    ? "/dashboard-artist"
                                                                    : (session.user as any)?.role === 'admin'
                                                                        ? "/admin"
                                                                        : "/compte"
                                                            }
                                                            className="text-2xl font-grand-slang text-white hover:text-blue-400 transition-colors text-left"
                                                        >
                                                            Mon Espace
                                                        </Link>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setMenuView('login')}
                                                                className="text-2xl font-grand-slang text-white hover:text-blue-400 transition-colors text-left"
                                                            >
                                                                Connexion
                                                            </button>
                                                            <Link href="/inscription-client" className="text-2xl font-grand-slang text-white/50 hover:text-white transition-colors">
                                                                Créer un compte
                                                            </Link>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 2. SHOPPING (PANIER / FAVORIS) */}
                                            <div className="p-8 flex flex-col gap-4 group hover:bg-white/5 transition-colors duration-500">
                                                <div className="flex items-center gap-3 text-white/60 mb-2">
                                                    <ShoppingBag size={18} />
                                                    <span className="font-mono text-xs tracking-[0.2em] uppercase">Shopping</span>
                                                </div>
                                                <div className="flex gap-6">
                                                    <Link href="/panier" className="text-2xl font-grand-slang text-white hover:text-blue-400 transition-colors">
                                                        Panier (0)
                                                    </Link>
                                                    <Link href="/compte/favoris" className="text-2xl font-grand-slang text-white/50 hover:text-white transition-colors">
                                                        Favoris
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* 3. SOCIALS / LEGAL */}
                                            <div className="p-8 flex flex-col justify-between items-start md:items-end text-white/40 font-mono text-xs uppercase tracking-widest">
                                                <div className="flex gap-6 mb-4 md:mb-0">
                                                    <a href="#" className="hover:text-white transition-colors">Insta</a>
                                                    <a href="#" className="hover:text-white transition-colors">Twitter</a>
                                                    <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                                                </div>
                                                <div className="text-right">
                                                    <span>© 2025 Blue Cinis</span>
                                                </div>
                                            </div>

                                        </div>
                                    </m.div>
                                </m.div>
                            ) : (
                                <m.div
                                    key="login"
                                    variants={loginSlideVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="flex-1 flex flex-col justify-center items-center w-full relative z-20 px-4"
                                >
                                    {/* LOGIN FORM - GLASSMORPHISM */}
                                    <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl relative">

                                        {/* Back Button */}
                                        <button
                                            onClick={() => setMenuView('nav')}
                                            className="absolute top-8 left-8 text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                                        >
                                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                            <span className="font-mono text-xs uppercase tracking-widest">Retour</span>
                                        </button>

                                        <div className="mt-12 mb-8 text-center">
                                            <h2 className="font-grand-slang text-4xl text-white mb-2">Connexion</h2>
                                            <p className="text-white/40 font-mono text-xs">Accédez à votre espace collectionneur</p>
                                        </div>

                                        <form className="flex flex-col gap-6" onSubmit={handleLogin}>
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono uppercase tracking-widest text-white/60 ml-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="collectionneur@blue-cinis.com"
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/40 focus:bg-black/40 transition-all font-sans"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono uppercase tracking-widest text-white/60 ml-1">Mot de passe</label>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••••••"
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/40 focus:bg-black/40 transition-all font-sans"
                                                />
                                            </div>

                                            {error && (
                                                <p className="text-red-400 text-xs text-center">{error}</p>
                                            )}

                                            <button
                                                disabled={loading}
                                                className="w-full bg-white text-black font-mono uppercase tracking-widest text-xs py-4 rounded-lg hover:bg-blue-100 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? "Connexion..." : "Entrer dans la galerie"}
                                            </button>
                                        </form>

                                        <div className="mt-8 text-center">
                                            <Link href="/reset-password" className="text-white/30 text-xs hover:text-white transition-colors">
                                                Mot de passe oublié ?
                                            </Link>
                                        </div>

                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>

                    </m.div>
                )}
            </AnimatePresence>
        </>
    );
}
