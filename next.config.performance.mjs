import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'next-intl',
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts'
    ],
    scrollRestoration: true,
    esmExternals: true,
    webVitalsAttribution: ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'],
    // Enable turbo mode for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Server external packages
  serverExternalPackages: ['sharp'],
  
  // Optimized images
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
    qualities: [75, 100],
  },
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
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

    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Optimized entry management
  onDemandEntries: {
    maxInactiveAge: process.env.NODE_ENV === 'development' ? 1000 : 25 * 1000,
    pagesBufferLength: process.env.NODE_ENV === 'development' ? 1 : 2,
  },
  
  // Performance headers
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
          // Cache static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300',
          },
        ],
      },
    ]
  },
  
  // Redirections for old URLs
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Rewrites for assets
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
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default withNextIntl(nextConfig)