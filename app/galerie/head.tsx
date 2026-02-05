import { getGalleryJsonLd } from "./seo";

export default async function GalleryHead() {
  const jsonLd = await getGalleryJsonLd();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

