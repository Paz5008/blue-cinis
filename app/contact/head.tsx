import { getContactJsonLd } from "./seo";

export default async function ContactHead() {
  const jsonLd = await getContactJsonLd();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
