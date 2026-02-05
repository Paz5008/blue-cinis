"use client";

import { useStore } from "@/lib/store";
import SearchInput from "@/components/artistes/SearchInput";
import SortSelect from "@/components/ui/SortSelect";
import PaginationGeneric from "@/components/ui/PaginationGeneric";

interface ArtistesToolbarProps {
    sort: string;
    page: number;
    totalPages: number;
    search?: string;
}

export default function ArtistesToolbar({ sort, page, totalPages, search }: ArtistesToolbarProps) {
    const isMenuOpen = useStore((state) => state.isMenuOpen);

    // Hide toolbar when global menu is open
    if (isMenuOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#030303]/90 backdrop-blur-xl border-t border-white/10">
            <div className="container mx-auto px-6 py-4">
                <div className="flex flex-col gap-4">
                    {/* Search and Sort row */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <SearchInput className="w-full md:max-w-sm" />
                        <SortSelect initialSort={sort} className="md:ml-auto" />
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center">
                            <PaginationGeneric
                                currentPage={page}
                                totalPages={totalPages}
                                makeHref={(p) => `/artistes?page=${p}&sort=${encodeURIComponent(sort)}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
