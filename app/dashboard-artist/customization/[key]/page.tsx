import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ensureArtistProfile } from '@/lib/artist-profile';
import { getCategories } from '@/lib/data/categories';
import { LOREM_ARTWORKS } from '@/lib/cms/lorem-artworks';

import Editor from '@/components/dashboard/EditorLazy';
import { EditorErrorBoundary } from '@/components/dashboard/editor/EditorErrorBoundary';

type PageParams =
  | { key: string }
  | Promise<{ key: string }>;

type PageSearchParams =
  | { [key: string]: string | string[] | undefined }
  | Promise<{ [key: string]: string | string[] | undefined }>;

const PAGE_NAVIGATION = [
  { key: 'profile', label: 'Profil', href: '/dashboard-artist/customization/profile' },
  { key: 'poster', label: 'Affiche', href: '/dashboard-artist/customization/poster' },

];

export default async function Page(props: { params: PageParams; searchParams?: PageSearchParams }) {
  const { params, searchParams } = props;
  const session = await auth();

  if (!session || session.user.role !== 'artist') {
    redirect('/');
  }

  const { key: rawKey } = await (params as any);
  const key = (rawKey || 'profile').toLowerCase();

  if (key === 'artworks') {
    redirect('/dashboard-artist/customization/profile?modal=artwork');
  }

  const search = await (searchParams ?? {});
  const modalQuery = Array.isArray(search.modal) ? search.modal[0] : search.modal;
  const openArtworkModal = modalQuery === 'artwork';

  let artist: any = null;
  let artworks: any[] = [];

  try {
    artist = await ensureArtistProfile(session as Session, {
      select: {
        id: true,
        slug: true,
        name: true,
        biography: true,
        photoUrl: true,
        phone: true,
        portfolio: true,
        artStyle: true,
        instagramUrl: true,
        facebookUrl: true,
        enableCommerce: true,
        enableLeads: true,
        stripeAccountId: true,
      },
    });
    try {
      artworks = artist
        ? await prisma.artwork.findMany({
          where: { artistId: artist.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            price: true,
            dimensions: true,
            year: true,
            description: true,
            artistName: true,
            categoryId: true,
            createdAt: true,
            artist: { select: { stripeAccountId: true, enableCommerce: true } },
          },
        })
        : [];
    } catch {
      artworks = artist
        ? await prisma.artwork.findMany({
          where: { artistId: artist.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            price: true,
            dimensions: true,
            year: true,
            description: true,
            artistName: true,
            categoryId: true,
            createdAt: true,
            artist: { select: { stripeAccountId: true } },
          },
        })
        : [];
      artworks = artworks.map(artwork => ({
        ...artwork,
        artist: { ...artwork.artist, enableCommerce: true },
      }));
    }
  } catch {
    artist = null;
    artworks = [];
  }

  const categories = await getCategories().catch(() => []);

  let initialContent: any = {};
  let publicationStatus: 'draft' | 'published' = 'draft';
  let publishedAt: Date | null = null;

  try {
    const page = await prisma.artistPage.findUnique({
      where: { userId_key: { userId: session.user.id, key } },
      select: {
        draftContent: true,
        publishedContent: true,
        status: true,
        publishedAt: true,
        desktopLayout: true,
        mobileLayout: true,
        globalStyles: true,
      },
    });

    if (page) {
      const content = (page.draftContent || page.publishedContent || {}) as any;

      if (page.desktopLayout && page.mobileLayout) {
        // Optimal V2 Structure
        initialContent = {
          blocksData: content.blocksData || {}, // Blocks content still in JSON but could be separated later
          layout: {
            desktop: page.desktopLayout,
            mobile: page.mobileLayout
          },
          theme: page.globalStyles || content.theme || {},
          settings: content.settings || {}
        }
      } else if (content.blocksData && content.layout) {
        // Already in new format
        initialContent = content;
      } else if (Array.isArray(content.blocks)) {
        // Legacy format: migrate on the fly
        const blockIds = content.blocks.map((b: any) => b.id);
        const dataMap: Record<string, any> = {};
        content.blocks.forEach((b: any) => {
          dataMap[b.id] = b;
        });

        initialContent = {
          blocksData: dataMap,
          layout: {
            desktop: blockIds,
            mobile: blockIds,  // Same order initially for legacy data
          },
          theme: content.theme,
          meta: content.meta,
          settings: content.settings,
        };
      } else {
        // Empty or invalid
        initialContent = {};
      }

      publicationStatus =
        (page.status as any) || (page.publishedContent ? 'published' : 'draft');
      publishedAt = page.publishedAt || null;
    }
  } catch {
    initialContent = {};
    publicationStatus = 'draft';
  }






  const artistData = {
    id: artist?.id ?? 'artist-preview',
    slug: artist?.slug || null,
    name: artist?.name || '',
    photoUrl: artist?.photoUrl || '',
    biography: artist?.biography || '',
    artworks: Array.isArray(artworks)
      ? [...artworks, ...LOREM_ARTWORKS].slice(0, 50).map(artwork => ({ // Increased limit to include lorem
        id: artwork.id,
        title: artwork.title,
        imageUrl: artwork.imageUrl,
      }))
      : LOREM_ARTWORKS.map(artwork => ({
        id: artwork.id,
        title: artwork.title,
        imageUrl: artwork.imageUrl,
      })),
  };

  const publicBase = artist ? `/artistes/${artist.slug || artist.id}` : undefined;
  const previewUrl = publicBase
    ? key === 'poster'
      ? `${publicBase}/poster`
      : publicBase
    : undefined;

  const bannerInsights: any = null;

  const formattedPublishedAt =
    publishedAt && !Number.isNaN(new Date(publishedAt).getTime())
      ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(publishedAt))
      : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="min-h-0 flex-1 relative" // editor handles overflow
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundColor: '#fff',
        }}
      >
        <EditorErrorBoundary>
          <Editor
            initialContent={initialContent}
            oeuvreOptions={[...artworks, ...LOREM_ARTWORKS].map(artwork => ({
              ...artwork,
              artistHasStripe: !!(artwork as any).artist?.stripeAccountId,
              artistEnableCommerce: (artwork as any).artist?.enableCommerce !== false,
            }))}
            artistData={artistData}
            previewUrl={previewUrl}
            initialPublicationStatus={publicationStatus}
            pageKey={key}
            bannerInsights={bannerInsights}
            artistHasStripe={!!artist?.stripeAccountId}
            pageNavigation={PAGE_NAVIGATION}
            lastPublishedAt={formattedPublishedAt}
            artworkCategories={categories.map(category => ({
              id: category.id,
              name: category.name,
            }))}
            initialArtworkModalOpen={openArtworkModal}
          />
        </EditorErrorBoundary>
      </div>
    </div>
  );
}
