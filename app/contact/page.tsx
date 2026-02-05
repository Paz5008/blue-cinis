import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";
import { getContactMetadata, CONTACT_PAGE_URL, CONTACT_CANONICAL_PATH, CONTACT_OG_IMAGE } from "./seo";
import { resolveLocale } from "@/lib/i18n/server";
import { getContactCopy } from "./copy";

export default async function ContactPage() {
  const locale = await resolveLocale();
  const copy = getContactCopy(locale);
  return <ContactPageClient copy={copy} />;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const copy = getContactMetadata(locale);
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: CONTACT_CANONICAL_PATH,
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: CONTACT_PAGE_URL,
      type: "website",
      images: [
        {
          url: CONTACT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: copy.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [CONTACT_OG_IMAGE],
    },
  };
}
