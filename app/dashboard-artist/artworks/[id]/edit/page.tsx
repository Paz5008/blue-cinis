import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EditArtworkForm from '../../../../../components/dashboard/EditArtworkForm';

type EditArtworkPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type SessionUserShape = {
  id?: string;
  role?: string;
};

function requireArtistUser(user: SessionUserShape | undefined): asserts user is SessionUserShape & { id: string; role: 'artist' } {
  if (!user || user.role !== 'artist' || !user.id) {
    redirect('/');
  }
}

export default async function EditArtworkPage({ params }: EditArtworkPageProps) {
  const session = await auth();
  const user = session?.user as SessionUserShape | undefined;
  requireArtistUser(user);

  const { id } = await params;

  const artwork = await prisma.artwork.findFirst({
    where: { id: id, artist: { userId: user.id } },
    select: {
      id: true,
      title: true,
      price: true,
      year: true,
      dimensions: true,
      description: true,
      categoryId: true,
      imageUrl: true,
      status: true,
    },
  });

  if (!artwork) {
    redirect('/dashboard-artist/artworks');
  }

  const categories = await prisma.category.findMany({ select: { id: true, name: true } });

  const transformedArtwork = {
    ...artwork,
    dimensions: typeof artwork.dimensions === 'string'
      ? artwork.dimensions
      : (artwork.dimensions ? JSON.stringify(artwork.dimensions) : null),
  };

  return (
    <div className="p-8 relative z-10" data-lenis-prevent>
      <h1 className="text-2xl font-bold mb-4">Éditer une Œuvre</h1>
      <EditArtworkForm key={artwork.id} initialData={transformedArtwork} categories={categories} />
    </div>
  );
}
