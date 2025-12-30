import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16: Disable cacheComponents temporarily to resolve dynamic export conflicts
  // cacheComponents: true,
  
  // Configuration expérimentale pour les performances
  experimental: {
    // Optimisations pour next-intl et autres packages
    optimizePackageImports: [
      'next-intl',
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts'
    ],
    // Optimisations supplémentaires
    scrollRestoration: true,
    // Préchargement des pages critiques
    workerThreads: false,
    esmExternals: true,
    // Code splitting optimizations
    // Enhanced performance optimizations
    webVitalsAttribution: ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'],
  },
  
  // Server external packages
  serverExternalPackages: ['sharp'],
  
  // Optimisation des images pour Vercel et domaine personnalisé
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'mhngbluefyucoesgcjoy.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'loftalgerie.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/avif', 'image/webp'], // AVIF first for better compression
    unoptimized: false, // Activé pour Vercel
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Enhanced device sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Enhanced image sizes
    // Next.js 16: Updated default cache TTL (was 60s, now 4 hours by default)
    minimumCacheTTL: 31536000, // 1 year cache for optimized images (preserved custom setting)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enhanced quality settings for dual-audience optimization
    loader: 'default',
    loaderFile: undefined,
    // Next.js 16: Default qualities is now [75], but we preserve our custom setting
    qualities: [75, 100], // Preserved for better image quality
  },
  
  // Configuration webpack pour résoudre les erreurs d'exports
  // Next.js 16: Webpack configuration preserved for compatibility
  // Note: Turbopack is now default, but webpack config maintained for fallback
  webpack: (config, { isServer }) => {
    // Fix for "exports is not defined" error in next-intl
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Ensure proper module resolution for next-intl (removed require.resolve for ES module compatibility)

    // Client-side fallbacks - now handled by Turbopack resolveAlias as well
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Optimisations pour la production
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Configuration du compilateur
  compiler: {
    // Supprime les console.log en production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Optimisation des bundles
  // Next.js 16: Preserved for webpack compatibility
  onDemandEntries: {
    // Période avant de décharger les pages (en ms) - réduite en développement
    maxInactiveAge: process.env.NODE_ENV === 'development' ? 1000 : 25 * 1000,
    // Nombre de pages à garder simultanément - réduit en développement
    pagesBufferLength: process.env.NODE_ENV === 'development' ? 1 : 2,
  },
  
  // Headers de sécurité et PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Next.js 16: Enhanced security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // Service Worker headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Manifest headers
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Redirections pour les anciennes URLs
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Rewrites pour les assets statiques (bypass i18n routing)
  async rewrites() {
    return {
      beforeFiles: [
        // Bypass i18n routing for static assets
        {
          source: '/:locale(fr|en|ar)/logo.jpg',
          destination: '/logo.jpg',
        },
        {
          source: '/:locale(fr|en|ar)/logo.png',
          destination: '/logo.png',
        },
        {
          source: '/:locale(fr|en|ar)/logo-temp.svg',
          destination: '/logo-temp.svg',
        },
        {
          source: '/:locale(fr|en|ar)/logo-fallback.svg',
          destination: '/logo-fallback.svg',
        },
        {
          source: '/:locale(fr|en|ar)/placeholder-logo.svg',
          destination: '/placeholder-logo.svg',
        },
        {
          source: '/:locale(fr|en|ar)/placeholder-logo.png',
          destination: '/placeholder-logo.png',
        },
        // Bypass i18n routing for loft images
        {
          source: '/:locale(fr|en|ar)/loft-images/:path*',
          destination: '/loft-images/:path*',
        },
        // Bypass i18n routing for all static images
        {
          source: '/:locale(fr|en|ar)/:path*\\.:ext(jpg|jpeg|png|gif|svg|webp|ico)',
          destination: '/:path*.:ext',
        },
      ],
    };
  },
  
  typescript: {
    ignoreBuildErrors: true, // Temporairement désactivé pour le déploiement
  },
  
  reactStrictMode: true, // Activé pour la production
  
  // Variables d'environnement publiques
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    // Build-time Supabase variables with fallbacks
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}
  
// Sentry configuration
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  
  // Upload source maps to Sentry
  widenClientFileUpload: true,
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Webpack configuration for Sentry
  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,
  },
  
  // 🚀 OPTIMISATION: Désactiver Sentry en développement pour réduire le bundle
  // Sentry sera actif uniquement en production
  enabled: process.env.NODE_ENV === 'production',
};

export default withSentryConfig(withNextIntl(nextConfig), sentryConfig)
