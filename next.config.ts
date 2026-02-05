import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Liste des domaines d'images autorisés (séparés par virgule via IMAGE_DOMAINS env ou valeurs par défaut)
const allowedImageDomains: string[] =
  process.env.IMAGE_DOMAINS?.split(",") ?? [
    // Domaines courants d'images optimisées
    "res.cloudinary.com",
    "images.unsplash.com",
    "i.imgur.com",
    "picsum.photos",
    "placehold.co",
    "example.com",
  ];

const isProd = process.env.NODE_ENV === 'production';
const baseSecurityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    domains: allowedImageDomains,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.html$/,
      type: 'asset/source',
    });

    // Exclude Node.js polyfills from client bundle to reduce size (~200KB savings)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        buffer: false,
        stream: false,
        util: false,
        path: false,
        fs: false,
      };
    }

    return config;
  },
  async headers() {
    const strictHeaders = isProd
      ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
      : [];

    const defaultHeaders = [
      {
        source: '/(.*)',
        headers: [...baseSecurityHeaders, ...strictHeaders],
      },
    ];

    const assetRoutes = ['/_next/static/:path*', '/_next/image', '/favicon.ico'].map((source) => ({
      source,
      headers: baseSecurityHeaders,
    }));

    return [...defaultHeaders, ...assetRoutes];
  },
  async redirects() {
    return [
      {
        source: '/dashboard-artist/settings',
        destination: '/dashboard-artist/parametres',
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};


export default withBundleAnalyzer(nextConfig);
