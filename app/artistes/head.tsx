import { getArtistsJsonLd } from "./seo";

export default async function ArtistsHead() {
  const jsonLd = await getArtistsJsonLd();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

