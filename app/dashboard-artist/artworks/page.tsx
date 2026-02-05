import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { ensureArtistProfile } from '@/lib/artist-profile';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import { buildArtworkPath } from '@/lib/artworkSlug';

import AddArtworkButton from '@/components/dashboard/AddArtworkButton';

export default async function MyArtworksPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'artist') {
    redirect('/');
  }
  const artist = await ensureArtistProfile(session as Session);
  if (!artist) {
    return <div className="p-8">Aucun profil artiste associé à ce compte.</div>;
  }

  const [artworks, categories] = await Promise.all([
    prisma.artwork.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, price: true, imageUrl: true },
    }),
    prisma.category.findMany({
      select: { id: true, name: true }
    })
  ]);

  return (
    <section className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white">Mes œuvres</h1>
          <p className="text-white/60 mt-1">Gérez votre catalogue et vos publications.</p>
        </div>
        <AddArtworkButton categories={categories} />
      </div>

      {artworks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <h3 className="text-xl font-serif text-white mb-2">Votre galerie est vide</h3>
          <p className="text-white/50 mb-6">Ajoutez votre première œuvre pour commencer à vendre.</p>
          <div className="inline-block">
            <AddArtworkButton categories={categories} />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artworks.map(a => (
            <div key={a.id} className="group flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-white/20 hover:bg-white/10">
              <div className="aspect-[4/3] w-full relative bg-white/5 overflow-hidden">
                {a.imageUrl ? (
                  <Image
                    src={a.imageUrl}
                    alt={a.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20 text-xs uppercase tracking-widest">Sans image</div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-serif text-lg text-white mb-1 truncate">{a.title}</h3>
                <p className="text-sm text-white/50 mb-4">{typeof a.price === 'number' ? `${a.price} €` : 'Prix non défini'}</p>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Link
                    href={`/dashboard-artist/artworks/${a.id}/edit`}
                    className="flex items-center justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                  >
                    Modifier
                  </Link>
                  <Link
                    href={buildArtworkPath({ id: a.id, title: a.title })}
                    target="_blank"
                    className="flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-white/60 hover:text-white hover:border-white/30 transition-colors"
                  >
                    Voir
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
