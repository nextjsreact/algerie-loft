import createNextIntlPlugin from 'next-intl/plugin';

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
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    loaderFile: undefined,
    qualities: [75, 100],
  },
  
  // Configuration webpack pour résoudre les erreurs d'exports
  webpack: (config, { isServer }) => {
    // Fix for "exports is not defined" error in next-intl
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Client-side fallbacks
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
  onDemandEntries: {
    maxInactiveAge: process.env.NODE_ENV === 'development' ? 1000 : 25 * 1000,
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
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
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

  // Rewrites pour les assets statiques
  async rewrites() {
    return {
      beforeFiles: [
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
        {
          source: '/:locale(fr|en|ar)/loft-images/:path*',
          destination: '/loft-images/:path*',
        },
        {
          source: '/:locale(fr|en|ar)/:path*\\.:ext(jpg|jpeg|png|gif|svg|webp|ico)',
          destination: '/:path*.:ext',
        },
      ],
    };
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  reactStrictMode: true,
  
  // Variables d'environnement publiques
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default withNextIntl(nextConfig)