import { prisma } from "@/lib/prisma";
import { notFound, permanentRedirect } from "next/navigation";
import ZoomableImage from "@/components/ui/ZoomableImage";
import AddToCartWithStock from "@/components/features/commerce/AddToCartWithStock";
import CheckoutEstimate from "@/components/features/commerce/CheckoutEstimate";
import Link from "next/link";
import LeadRequestButton from "@/components/features/gallery/LeadRequestButton";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { artworkDetailTag } from "@/lib/cacheTags";
import {
  buildArtworkPath,
  buildArtworkSlug,
  extractArtworkIdFromParam,
} from "@/lib/artworkSlug";
import { RecommendedArtworks } from '@/components/artwork/RecommendedArtworks';
import { ViewInRoomSection } from '@/components/artwork/ViewInRoomSection';

function maybeGetSlug(record: unknown) {
  if (record && typeof record === "object" && "slug" in record) {
    const value = (record as Record<string, unknown>).slug;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

const ARTWORK_REVALIDATE_SECONDS = 300;

export const revalidate = 300;
export const dynamicParams = true;

async function getArtworkWithInventory(id: string) {
  const cached = unstable_cache(
    async () => {
      const [artwork, reservations] = await Promise.all([
        prisma.artwork.findUnique({
          where: { id },
          include: {
            category: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                photoUrl: true,
                enableLeads: true,
                enableCommerce: true,
                stripeAccountId: true,
              },
            },
            variants: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                name: true,
                priceOverride: true,
                stockQuantity: true,
              },
            },
          },
        }),
        prisma.reservation.groupBy({
          by: ["variantId"],
          where: {
            artworkId: id,
            status: "active",
            expiresAt: { gt: new Date() },
          },
          _sum: { quantity: true },
        }),
      ]);

      if (!artwork) {
        return null;
      }

      const reservedByVariant = new Map<string | null, number>();
      for (const entry of reservations) {
        reservedByVariant.set(entry.variantId ?? null, entry._sum.quantity ?? 0);
      }

      const fallbackStock = typeof artwork.stockQuantity === "number" ? artwork.stockQuantity : 1;
      const reservedForBase = reservedByVariant.get(null) ?? 0;
      const baseAvailable = Math.max(0, fallbackStock - reservedForBase);

      const variants = artwork.variants.map((variant) => {
        const stock = typeof variant.stockQuantity === "number" ? variant.stockQuantity : 1;
        const reserved = reservedByVariant.get(variant.id) ?? 0;
        return {
          ...variant,
          available: Math.max(0, stock - reserved),
        };
      });

      return { artwork, availability: baseAvailable, variants };
    },
    ["artwork-detail", id],
    { revalidate: ARTWORK_REVALIDATE_SECONDS, tags: [artworkDetailTag(id)] }
  );
  return cached();
}

export async function generateStaticParams() {
  const artworks = await prisma.artwork.findMany({
    select: { id: true, title: true },
    where: { status: "available" },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return artworks.map((artwork) => ({
    slug: buildArtworkSlug({
      id: artwork.id,
      title: artwork.title,
      slug: maybeGetSlug(artwork),
    }),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artworkId = extractArtworkIdFromParam(slug);
  const record = await getArtworkWithInventory(artworkId);
  if (!record?.artwork) {
    return {
      title: "Œuvre introuvable | Blue Cinis",
    };
  }

  const canonicalPath = buildArtworkPath({
    id: record.artwork.id,
    title: record.artwork.title,
    slug: maybeGetSlug(record.artwork),
  });
  const absoluteCanonical = `${process.env.NEXTAUTH_URL || "https://blue-cinis.com"}${canonicalPath}`;

  // Build product meta tags for SEO (e-commerce)
  const productMeta: Record<string, string> = {};
  if (record.artwork.price) {
    productMeta['product:price:amount'] = String(record.artwork.price);
    productMeta['product:price:currency'] = 'EUR';
  }
  productMeta['product:availability'] = record.artwork.status === 'available' ? 'in stock' : 'out of stock';

  return {
    title: `${record.artwork.title} – Blue Cinis`,
    description:
      record.artwork.description?.slice(0, 150) ??
      "Découvrez les détails, les dimensions et la disponibilité de cette œuvre originale sur Blue Cinis.",
    alternates: {
      canonical: canonicalPath,
    },
    other: productMeta,
    openGraph: {
      title: record.artwork.title,
      description: record.artwork.description ?? undefined,
      url: absoluteCanonical,
      type: 'website',
      images: record.artwork.imageUrl ? [{ url: record.artwork.imageUrl, width: 1200, height: 630, alt: record.artwork.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: record.artwork.title,
      description: record.artwork.description?.slice(0, 150) ?? undefined,
      images: record.artwork.imageUrl ? [record.artwork.imageUrl] : undefined,
    },
  };
}

export default async function ArtworkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artworkId = extractArtworkIdFromParam(slug);
  const record = await getArtworkWithInventory(artworkId);

  if (!record?.artwork) {
    notFound();
  }

  const { artwork, availability, variants } = record;
  const canonicalPath = buildArtworkPath({
    id: artwork.id,
    title: artwork.title,
    slug: maybeGetSlug(artwork),
  });
  const canonicalSlug = canonicalPath.split("/").pop()!;
  if (slug !== canonicalSlug) {
    permanentRedirect(canonicalPath);
  }
  const absoluteCanonical = `${process.env.NEXTAUTH_URL || "https://blue-cinis.com"}${canonicalPath}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    image: artwork.imageUrl,
    creator: artwork.artistName || undefined,
    materialExtent: artwork.dimensions || undefined,
    dateCreated: artwork.year || undefined,
    offers:
      typeof artwork.price === "number"
        ? {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: artwork.price,
          availability: availability > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        }
        : undefined,
    url: absoluteCanonical,
  };

  return (
    <main className="min-h-screen bg-[#030303]">
      <div className="container mx-auto px-6 py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Galerie",
                  item: `${process.env.NEXTAUTH_URL || "https://blue-cinis.com"}/galerie`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: artwork.title,
                  item: absoluteCanonical,
                },
              ],
            }),
          }}
        />

        {/* Back Link */}
        <Link
          href="/galerie"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <span>←</span>
          <span>Retour à la galerie</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="relative">
            <div className="sticky top-8">
              <ZoomableImage
                src={artwork.imageUrl}
                alt={artwork.title}
                className="rounded-2xl object-cover w-full"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-8">
            {/* Category Badge */}
            {artwork.category && (
              <span className="inline-flex items-center gap-2 text-blue-400 font-mono text-xs tracking-[0.3em] uppercase">
                <span className="w-8 h-[1px] bg-blue-400" />
                {artwork.category.name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-grand-slang text-white leading-tight">
              {artwork.title}
            </h1>

            {/* Artist Info */}
            {artwork.artist && (
              <Link
                href={artwork.artist.slug ? `/artistes/${artwork.artist.slug}` : `/artistes/${artwork.artist.id}`}
                className="inline-flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all group"
              >
                {/* Artist Photo */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
                  {artwork.artist.photoUrl ? (
                    <img
                      src={artwork.artist.photoUrl}
                      alt={artwork.artist.name || "Artiste"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white/60">
                      {artwork.artist.name?.charAt(0).toUpperCase() || "A"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/50 mb-0.5">Artiste</p>
                  <p className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                    {artwork.artist.name || artwork.artistName || "Artiste inconnu"}
                  </p>
                </div>
                <span className="text-white/30 group-hover:text-blue-400 transition-colors">→</span>
              </Link>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <p className="text-3xl font-semibold text-white">
                {typeof artwork.price === "number"
                  ? (() => {
                    try {
                      return new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 0,
                      }).format(artwork.price);
                    } catch {
                      return `${artwork.price} €`;
                    }
                  })()
                  : ""}
              </p>
              {artwork.status === "sold" && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">
                  Vendu
                </span>
              )}
              {artwork.status === "available" && availability > 0 && (
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                  Disponible
                </span>
              )}
            </div>

            {/* Description */}
            {artwork.description && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <p className="text-white/70 leading-relaxed">
                  {artwork.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {artwork.year && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Année</p>
                  <p className="text-white font-medium">{artwork.year}</p>
                </div>
              )}
              {(artwork.widthCm || artwork.heightCm || artwork.dimensions) && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Dimensions</p>
                  <p className="text-white font-medium">
                    {artwork.widthCm && artwork.heightCm
                      ? `${artwork.widthCm} × ${artwork.heightCm}${artwork.depthCm ? ` × ${artwork.depthCm}` : ''} cm`
                      : typeof artwork.dimensions === 'string'
                        ? artwork.dimensions
                        : artwork.dimensions
                          ? `${(artwork.dimensions as { width?: number })?.width || '-'} × ${(artwork.dimensions as { height?: number })?.height || '-'} cm`
                          : 'Non spécifié'
                    }
                  </p>
                </div>
              )}
              {artwork.medium && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Technique</p>
                  <p className="text-white font-medium">{artwork.medium}</p>
                </div>
              )}
              {artwork.condition && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">État</p>
                  <p className="text-white font-medium">{artwork.condition}</p>
                </div>
              )}
              {artwork.provenance && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Provenance</p>
                  <p className="text-white font-medium">{artwork.provenance}</p>
                </div>
              )}
              {artwork.orientation && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Orientation</p>
                  <p className="text-white font-medium capitalize">{artwork.orientation}</p>
                </div>
              )}
            </div>

            {/* Artwork Badges */}
            <div className="flex flex-wrap gap-2">
              {artwork.isOriginal && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-full text-sm text-amber-400 border border-amber-500/20">
                  <span>✦</span> Original
                </span>
              )}
              {artwork.isSigned && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 rounded-full text-sm text-purple-400 border border-purple-500/20">
                  <span>✎</span> Signé
                </span>
              )}
              {artwork.isFramed && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-full text-sm text-blue-400 border border-blue-500/20">
                  <span>▢</span> Encadré
                </span>
              )}
              {artwork.certificate && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-full text-sm text-green-400 border border-green-500/20">
                  <span>✓</span> Certificat
                </span>
              )}
            </div>

            {/* Style Tags */}
            {artwork.style && artwork.style.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-wider">Style</p>
                <div className="flex flex-wrap gap-2">
                  {artwork.style.map((s: string) => (
                    <span key={s} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/70 border border-white/10 capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Commerce Actions */}
            <div className="space-y-4">
              {artwork.status === "available" &&
                !!artwork.artist?.stripeAccountId &&
                artwork.artist?.enableCommerce !== false &&
                typeof artwork.price === "number" ? (
                <>
                  <AddToCartWithStock
                    artwork={{
                      id: String(artwork.id),
                      title: artwork.title,
                      price: artwork.price,
                      initialAvailability: availability,
                      variants,
                    }}
                  />
                  <CheckoutEstimate artworkId={String(artwork.id)} />
                </>
              ) : null}
              {artwork.status === "available" && artwork.artist?.enableLeads !== false ? (
                <LeadRequestButton artworkId={artwork.id} artworkTitle={artwork.title} />
              ) : null}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</span>
                Paiement sécurisé
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">✓</span>
                Expédition 3–7 jours
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs">✓</span>
                Service client réactif
              </div>
            </div>
          </div>
        </div>

        {/* View In Room AR */}
        {artwork.status === "available" && (
          <div className="mt-16">
            <ViewInRoomSection
              artworkImageUrl={artwork.imageUrl}
              artworkTitle={artwork.title}
              dimensions={artwork.dimensions as { width?: number; height?: number; unit?: string } | undefined}
            />
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-16">
          <RecommendedArtworks
            currentArtworkId={artwork.id}
            artistId={artwork.artistId}
            title="Vous aimerez aussi"
            limit={8}
          />
        </div>
      </div>
    </main>
  );
}
