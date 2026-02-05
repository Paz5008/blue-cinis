"use client";

import { useState, useRef } from "react";
import { m, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X, Grid3X3, LayoutGrid, ChevronDown, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/lib/store";

interface Category {
    id: string;
    name: string;
    slug?: string;
}

interface GalleryPageClientProps {
    artworks: any[];
    categories: Category[];
    initialFilters: {
        category?: string;
        minPrice?: string;
        maxPrice?: string;
        sort?: string;
    };
}

const PRICE_RANGES = [
    { label: "Tous les prix", min: "", max: "" },
    { label: "< 500€", min: "", max: "500" },
    { label: "500 - 2 000€", min: "500", max: "2000" },
    { label: "2 000 - 10 000€", min: "2000", max: "10000" },
    { label: "> 10 000€", min: "10000", max: "" },
];

const SORT_OPTIONS = [
    { value: "newest", label: "Nouveautés" },
    { value: "price_asc", label: "Prix ↑" },
    { value: "price_desc", label: "Prix ↓" },
];

export default function GalleryPageClient({ artworks, categories, initialFilters }: GalleryPageClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const heroRef = useRef<HTMLDivElement>(null);
    const { cart } = useCart();

    // Use global store for menu state (to hide toolbar when menu open)
    const isMenuOpen = useStore((state) => state.isMenuOpen);

    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "masonry">("grid");
    const [activeCategory, setActiveCategory] = useState(initialFilters.category || "");
    const [priceRange, setPriceRange] = useState({ min: initialFilters.minPrice || "", max: initialFilters.maxPrice || "" });
    const [sort, setSort] = useState(initialFilters.sort || "newest");

    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        const params = new URLSearchParams(searchParams.toString());
        const state = { category: activeCategory, minPrice: priceRange.min, maxPrice: priceRange.max, sort, ...overrides };
        Object.entries(state).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const clearFilters = () => {
        setActiveCategory("");
        setPriceRange({ min: "", max: "" });
        setSort("newest");
        router.push(pathname);
    };

    const hasActiveFilters = activeCategory || priceRange.min || priceRange.max || sort !== "newest";

    const formatPrice = (price: number | null) => {
        if (!price) return "Prix sur demande";
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(price);
    };

    return (
        <main className="min-h-screen bg-[#030303] text-white pb-40">

            {/* HERO SECTION */}
            <m.div
                ref={heroRef}
                className="relative h-[45vh] md:h-[55vh] overflow-hidden"
                style={{ opacity: heroOpacity, scale: heroScale }}
            >
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#030303]" />
                    {artworks[0]?.imageUrl && (
                        <Image
                            src={artworks[0].imageUrl}
                            alt=""
                            fill
                            className="object-cover opacity-30 blur-sm"
                            priority
                        />
                    )}
                </div>

                <div className="relative z-10 h-full flex flex-col justify-end pb-12 md:pb-20 container mx-auto px-6">
                    <m.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-blue-400 font-mono text-xs tracking-[0.4em] uppercase mb-4"
                    >
                        {artworks.length} œuvres disponibles
                    </m.span>

                    <m.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-grand-slang text-white leading-[0.95] mb-4"
                    >
                        La <span className="text-white/40">Collection</span>
                    </m.h1>

                    <m.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/50 text-base max-w-md"
                    >
                        Art contemporain curé par nos experts.
                    </m.p>
                </div>
            </m.div>

            {/* ARTWORK GRID */}
            <section className="container mx-auto px-6 py-12 md:py-16">
                {artworks.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-white/40 text-lg mb-4">Aucune œuvre trouvée.</p>
                        <button onClick={clearFilters} className="text-blue-400 hover:text-blue-300 transition-colors">
                            Réinitialiser les filtres
                        </button>
                    </div>
                ) : (
                    <m.div
                        className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : ""}`}
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                    >
                        {artworks.map((artwork) => (
                            <m.div
                                key={artwork.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                                }}
                            >
                                <ArtworkCard artwork={artwork} formatPrice={formatPrice} />
                            </m.div>
                        ))}
                    </m.div>
                )}
            </section>

            {/* FIXED BOTTOM TOOLBAR - Hidden when global menu is open */}
            {!isMenuOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#030303]/90 backdrop-blur-xl border-t border-white/10">
                    <div className="container mx-auto px-6 py-4">
                        {/* flex-col-reverse so expanded filters appear ABOVE the main toolbar */}
                        <div className="flex flex-col-reverse gap-4">
                            {/* Main toolbar row */}
                            <div className="flex items-center justify-between gap-4">
                                {/* Left: Filters toggle + Categories */}
                                <div className="flex items-center gap-3 flex-1">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${showFilters ? "border-blue-500 text-blue-400" : "border-white/20 text-white/60 hover:border-white/40"}`}
                                    >
                                        <SlidersHorizontal size={14} />
                                        <span className="hidden sm:inline">Filtres</span>
                                        {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                    </button>

                                    {/* Categories pills */}
                                    <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
                                        <button
                                            onClick={() => { setActiveCategory(""); applyFilters({ category: "" }); }}
                                            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${!activeCategory ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                                        >
                                            Tout
                                        </button>
                                        {categories.slice(0, 4).map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => { setActiveCategory(cat.id); applyFilters({ category: cat.id }); }}
                                                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${activeCategory === cat.id ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Sort + View + Cart */}
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <select
                                            value={sort}
                                            onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
                                            className="appearance-none bg-transparent border border-white/20 rounded-full px-3 py-1.5 pr-7 text-xs text-white/80 focus:outline-none cursor-pointer"
                                        >
                                            {SORT_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="bg-black">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                                    </div>

                                    <div className="hidden sm:flex items-center border border-white/20 rounded-full p-0.5">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={`p-1.5 rounded-full transition-colors ${viewMode === "grid" ? "bg-white/10" : ""}`}
                                        >
                                            <Grid3X3 size={12} className={viewMode === "grid" ? "text-white" : "text-white/40"} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("masonry")}
                                            className={`p-1.5 rounded-full transition-colors ${viewMode === "masonry" ? "bg-white/10" : ""}`}
                                        >
                                            <LayoutGrid size={12} className={viewMode === "masonry" ? "text-white" : "text-white/40"} />
                                        </button>
                                    </div>

                                    <Link href="/panier" className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
                                        <ShoppingBag size={18} className="text-white/70" />
                                        {cart.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center">
                                                {cart.length}
                                            </span>
                                        )}
                                    </Link>
                                </div>
                            </div>

                            {/* Expanded Filters */}
                            <AnimatePresence>
                                {showFilters && (
                                    <m.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-2 space-y-3">
                                            {/* Categories (mobile) */}
                                            <div className="md:hidden">
                                                <p className="text-xs text-white/40 mb-2">Catégories</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => { setActiveCategory(""); applyFilters({ category: "" }); }}
                                                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${!activeCategory ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                                                    >
                                                        Toutes
                                                    </button>
                                                    {categories.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() => { setActiveCategory(cat.id); applyFilters({ category: cat.id }); }}
                                                            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${activeCategory === cat.id ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Price ranges */}
                                            <div>
                                                <p className="text-xs text-white/40 mb-2">Prix</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {PRICE_RANGES.map((range) => {
                                                        const isActive = priceRange.min === range.min && priceRange.max === range.max;
                                                        return (
                                                            <button
                                                                key={range.label}
                                                                onClick={() => {
                                                                    setPriceRange({ min: range.min, max: range.max });
                                                                    applyFilters({ minPrice: range.min, maxPrice: range.max });
                                                                }}
                                                                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${isActive ? "bg-blue-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                                                            >
                                                                {range.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {hasActiveFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="flex items-center gap-1 text-red-400/70 hover:text-red-400 text-xs"
                                                >
                                                    <X size={12} />
                                                    Réinitialiser les filtres
                                                </button>
                                            )}
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function ArtworkCard({ artwork, formatPrice }: { artwork: any; formatPrice: (p: number | null) => string }) {
    const artistName = artwork.artist?.name || artwork.artistName || "Artiste inconnu";
    const artistId = artwork.artist?.id || artwork.artistId;
    const artistSlug = artwork.artist?.slug;

    // Build artist link - prefer slug, fallback to id
    const artistHref = artistSlug
        ? `/artistes/${artistSlug}`
        : artistId
            ? `/artistes/${artistId}`
            : null;

    return (
        <div className="group relative rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all duration-300">
            {/* Image & Title - Link to artwork */}
            <Link href={`/galerie/${artwork.id}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                        src={artwork.imageUrl || "/placeholder.jpg"}
                        alt={artwork.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {artwork.status === "sold" && (
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
                            <span className="text-xs font-mono text-white/60">VENDU</span>
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-4">
                <Link href={`/galerie/${artwork.id}`}>
                    <h3 className="font-grand-slang text-base text-white mb-1 line-clamp-1 hover:text-blue-100 transition-colors">
                        {artwork.title}
                    </h3>
                </Link>

                {/* Artist name - separate link */}
                {artistHref ? (
                    <Link
                        href={artistHref}
                        className="text-white/50 text-sm mb-2 block hover:text-blue-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {artistName}
                    </Link>
                ) : (
                    <p className="text-white/50 text-sm mb-2">{artistName}</p>
                )}

                <span className="text-white font-medium text-sm">{formatPrice(artwork.price)}</span>
            </div>
        </div>
    );
}
