// app/dashboard-artist/profile/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import SocialLinksInlineCard from "@/components/dashboard/SocialLinksInlineCard";
import { redirect } from "next/navigation";
import { buildArtworkPath } from "@/lib/artworkSlug";
export const dynamic = 'force-dynamic';

export default async function ArtistProfilePage() {
    // Récupérer la session côté serveur
    const session = await auth();
    if (!session || !session.user || session.user.role !== "artist" || !session.user.id) {
        // Si l'utilisateur n'est pas connecté ou n'est pas un artiste, on le redirige
        redirect("/");
    }

    // Récupérer l'artiste via l'ID de l'utilisateur (champ userId dans Artist)
    const artist = await prisma.artist.findUnique({
        where: { userId: session.user.id },
        include: { artworks: true },
    });
    if (!artist) {
        // Si le profil artiste n'est pas trouvé, on peut rediriger ou afficher un message
        redirect("/dashboard-artist");
    }

    return (
        <section className="p-8 bg-[var(--dash-bg)] min-h-screen text-[var(--dash-text)]">
            <div className="container mx-auto">
                {/* Profil de l'artiste */}
                <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-[var(--dash-sidebar-border)]">
                        <Image
                            src={artist.photoUrl || "/default-profile.jpg"}
                            alt={artist.name}
                            width={192}
                            height={192}
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
                        <p className="text-lg text-[var(--dash-sidebar-text-muted)]">
                            {artist.biography ||
                                "Aucune biographie n'est disponible pour cet artiste."}
                        </p>
                    </div>
                </div>

                {/* Galerie d'œuvres cliquable */}
                {artist.artworks && artist.artworks.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-3xl font-bold mb-4">Ses Œuvres</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {artist.artworks.map((work) => (
                                <a
                                    key={work.id}
                                    href={buildArtworkPath({ id: work.id, title: work.title })}
                                    className="block bg-[var(--dash-card-bg)] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition border border-[var(--dash-sidebar-border)]"
                                >
                                    <Image
                                        src={work.imageUrl || "/default-artwork.jpg"}
                                        alt={work.title}
                                        width={400}
                                        height={300}
                                        className="object-cover w-full h-48"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-xl font-bold">{work.title}</h3>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                )}

                {/* Réseaux sociaux - édition rapide */}
                <section className="mt-12">
                    <h2 className="text-3xl font-bold mb-4">Réseaux sociaux</h2>
                    <SocialLinksInlineCard />
                </section>

                {/* Liens d'édition ou de retour */}
                <div className="mt-8 text-center">
                    <a
                        href="/dashboard-artist"
                        className="text-blue-600 hover:underline text-lg"
                    >
                        ← Retour au Dashboard
                    </a>
                </div>
            </div>
        </section>
    );
}
