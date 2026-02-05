'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ArtworkCreateModal from './ArtworkCreateModal';
import { CategoryOption } from './ArtworkCreateForm';

type AddArtworkButtonProps = {
    categories: CategoryOption[];
};

export default function AddArtworkButton({ categories }: AddArtworkButtonProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpen = () => setIsModalOpen(true);
    const handleClose = () => setIsModalOpen(false);

    const handleCreated = useCallback(() => {
        router.refresh();
        handleClose();
    }, [router]);

    return (
        <>
            <button
                onClick={handleOpen}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
                Ajouter une œuvre
            </button>

            <ArtworkCreateModal
                open={isModalOpen}
                onClose={handleClose}
                categories={categories}
                onCreated={handleCreated}
            />
        </>
    );
}
