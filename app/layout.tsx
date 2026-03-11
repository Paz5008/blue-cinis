// app/layout.tsx
import type { Metadata } from "next";
import localFont from 'next/font/local'
import ClientLayout from "./ClientLayout"; // Assure-toi que le chemin est correct
import "./globals.css";
import Script from 'next/script'
import { headers, cookies } from 'next/headers'
import { auth } from '@/auth'
import CookieBanner from '@/components/shared/CookieBanner'
import { I18nProvider } from '@/i18n/provider'
import fr from '@/i18n/messages/fr.json'
import en from '@/i18n/messages/en.json'
import Preloader from "@/components/shared/Preloader";
import { ClientProviders } from "./ClientProviders";
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import Navigation from "@/components/ui/Navigation"; // Import du menu
import { getCategories } from '@/lib/data/categories'

const grandSlang = localFont({
  src: './fonts/GrandSlang-Roman.woff2',
  variable: '--font-playfair',
  display: 'swap',
})

// Métadonnées du site (inchangé)
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://blue-cinis.com"),
  title: {
    template: 'Blue Cinis — %s',
    default: "Blue Cinis — Art, Mémoire et Matière",
  },
  description: "Une galerie en ligne dédiée aux artistes contemporains, explorant la mémoire et la matière.",
  alternates: {
    languages: {
      fr: (process.env.NEXTAUTH_URL || 'https://blue-cinis.com') + '/?locale=fr',
      en: (process.env.NEXTAUTH_URL || 'https://blue-cinis.com') + '/?locale=en'
    }
  },
  openGraph: {
    title: "Blue Cinis - Art, Mémoire et Matière",
    description: "Une galerie en ligne dédiée aux artistes contemporains, explorant la mémoire et la matière.",
    url: "https://blue-cinis.com",
    siteName: "Blue Cinis",
    images: [
      {
        url: "/hero-background.webp",
        width: 1200,
        height: 630,
        alt: "Blue Cinis"
      }
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blue Cinis - Art, Mémoire et Matière",
    description: "Une galerie en ligne dédiée aux artistes contemporains, explorant la mémoire et la matière.",
    images: ["/hero-background.webp"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const nonce = hdrs.get('x-csp-nonce') || undefined
  const ck = await cookies()
  const consent = ck.get('consent_analytics')?.value === '1'
  const themeCookie = ck.get('theme')?.value === 'dark' ? 'dark' : 'light'
  const locale = (ck.get('locale')?.value === 'en' ? 'en' : 'fr') as 'fr' | 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = locale === 'en' ? (en as any) : (fr as any)
  const [session, categories] = await Promise.all([
    auth(),
    getCategories(),
  ])
  const initialTheme = themeCookie
  return (
    // Applique les variables de police globales et la langue
    // suppressHydrationWarning est utile si tu utilises des thèmes ou modifs client de la balise html/body
    <html
      lang={locale}
      data-theme={initialTheme}
      className={`${initialTheme === 'dark' ? 'dark' : ''} ${grandSlang.variable}`}
      suppressHydrationWarning={true}
    >
      <head>
        <link rel="icon" href="/IcoLGV1.svg" type="image/svg+xml" />
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            strategy="lazyOnload"
            nonce={nonce}
          />
        )}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && consent && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            nonce={nonce}
          />
        )}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_SRC && consent && (
          <Script
            async
            defer
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            src={process.env.NEXT_PUBLIC_UMAMI_SRC}
            nonce={nonce}
          />
        )}
      </head>
      <body
        className="antialiased text-body transition-colors duration-300"
        suppressHydrationWarning={true}
      >
        <I18nProvider locale={locale} messages={messages}>
          <ClientProviders session={session}>
            <Navigation />
            <Preloader />
            <NoiseOverlay />
            <CookieBanner />
            <ClientLayout
              categories={categories}
              initialSession={session}
            >
              {children}
            </ClientLayout>
          </ClientProviders>
        </I18nProvider>
        {/* Script pour Umami/Plausible local - optionnel */}
      </body>
    </html>
  );
}
