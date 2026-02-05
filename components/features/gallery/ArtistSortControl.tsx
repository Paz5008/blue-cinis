"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function ArtistSortControl() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const currentSort = searchParams.get('sort') || 'name_asc';

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', e.target.value);
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 uppercase tracking-widest hidden sm:block">Trier par</span>
            <select
                value={currentSort}
                onChange={handleChange}
                className="bg-black/20 border border-white/10 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-white/30 cursor-pointer"
            >
                <option value="name_asc">Nom (A-Z)</option>
                <option value="name_desc">Nom (Z-A)</option>
                <option value="artworks_desc">Nombre d'œuvres</option>
            </select>
        </div>
    );
}
