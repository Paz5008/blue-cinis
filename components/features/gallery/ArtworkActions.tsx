"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface ArtworkActionsProps {
    artworkId: string;
}

export default function ArtworkActions({ artworkId }: ArtworkActionsProps) {
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("Voulez-vous vraiment supprimer cette œuvre ?")) return;
        try {
            const res = await fetch(`/api/artist/artworks/${artworkId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                // On rafraîchit la page pour refléter la suppression
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "Erreur lors de la suppression");
            }
        } catch (error) {
            console.error("Erreur lors de la suppression", error);
            alert("Erreur lors de la suppression");
        }
    }

    return (
        <div className="mt-auto flex space-x-2 pt-4">
            <Link
                href={`/dashboard-artist/artworks/${artworkId}/edit`}
                className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
                Éditer
            </Link>
            <button
                onClick={handleDelete}
                className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700"
            >
                Supprimer
            </button>
        </div>
    );
}
