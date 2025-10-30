// =====================================================
// CDN AND PERFORMANCE CONFIGURATION
// =====================================================
// Configuration for CDN, caching, and performance optimization
// Requirements: 10.1, 10.2
// =====================================================

const CDN_CONFIG = {
  // =====================================================
  // CDN PROVIDERS CONFIGURATION
  // =====================================================
  providers: {
    cloudflare: {
      enabled: process.env.CDN_PROVIDER === 'cloudflare',
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      baseUrl: process.env.CDN_URL || 'https://cdn.your-domain.com',
      settings: {
        caching: {
          browserTtl: 31536000, // 1 year
          edgeTtl: 2592000,     // 30 days
          cacheLevel: 'aggressive'
        },
        security: {
          securityLevel: 'medium',
          challengePassage: 86400
        },
        performance: {
          minify: {
            css: true,
            js: true,
            html: true
          },
          compression: 'gzip',
          http2: true,
          http3: true
        }
      }
    },
    
    aws_cloudfront: {
      enabled: process.env.CDN_PROVIDER === 'aws',
      distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
      region: process.env.AWS_REGION || 'eu-west-1',
      baseUrl: process.env.CDN_URL,
      settings: {
        priceClass: 'PriceClass_100', // Use only North America and Europe
        compression: true,
        http2: true,
        ipv6: true
      }
    }
  },

  // =====================================================
  // ASSET OPTIMIZATION
  // =====================================================
  assets: {
    images: {
      formats: ['webp', 'avif', 'jpg', 'png'],
      quality: {
        webp: 85,
        avif: 80,
        jpg: 85,
        png: 90
      },
      sizes: [320, 640, 768, 1024, 1280, 1920],
      lazy: true,
      placeholder: 'blur'
    },
    
    fonts: {
      preload: [
        '/fonts/inter-var.woff2',
        '/fonts/arabic-font.woff2'
      ],
      display: 'swap',
      fallbacks: {
        'Inter': ['system-ui', 'sans-serif'],
        'Arabic Font': ['Tahoma', 'Arial', 'sans-serif']
      }
    },
    
    scripts: {
      compression: 'gzip',
      minification: true,
      bundling: 'aggressive',
      splitting: {
        vendor: true,
        common: true,
        pages: true
      }
    },
    
    styles: {
      compression: 'gzip',
      minification: true,
      purging: true,
      critical: true
    }
  },

  // =====================================================
  // CACHING STRATEGIES
  // =====================================================
  caching: {
    static: {
      // Static assets (images, fonts, etc.)
      pattern: /\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|css|js)$/,
      maxAge: 31536000, // 1 year
      immutable: true,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': new Date(Date.now() + 31536000000).toUTCString()
      }
    },
    
    dynamic: {
      // Dynamic pages
      pattern: /\.(html|json)$/,
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 3600, // 1 hour
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
      }
    },
    
    api: {
      // API responses
      pattern: /^\/api\//,
      maxAge: 60, // 1 minute
      staleWhileRevalidate: 300, // 5 minutes
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    },
    
    private: {
      // User-specific content
      pattern: /\/(profile|dashboard|reservations)/,
      maxAge: 0,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    }
  },

  // =====================================================
  // PERFORMANCE MONITORING
  // =====================================================
  monitoring: {
    metrics: {
      coreWebVitals: true,
      customMetrics: [
        'time-to-first-byte',
        'first-contentful-paint',
        'largest-contentful-paint',
        'cumulative-layout-shift',
        'first-input-delay'
      ]
    },
    
    thresholds: {
      lcp: 2500,  // Largest Contentful Paint
      fid: 100,   // First Input Delay
      cls: 0.1,   // Cumulative Layout Shift
      ttfb: 800   // Time to First Byte
    },
    
    reporting: {
      enabled: true,
      endpoint: '/api/analytics/performance',
      sampleRate: 0.1 // 10% sampling
    }
  }
};

// =====================================================
// NEXT.JS CONFIGURATION INTEGRATION
// =====================================================
const getNextConfig = () => {
  const config = {
    // Image optimization
    images: {
      domains: [
        'localhost',
        process.env.SUPABASE_URL?.replace('https://', ''),
        process.env.CDN_URL?.replace('https://', '')
      ].filter(Boolean),
      formats: CDN_CONFIG.assets.images.formats,
      deviceSizes: CDN_CONFIG.assets.images.sizes,
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 31536000,
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
    },

    // Compression
    compress: true,

    // Headers for caching and security
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on'
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block'
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin'
            }
          ]
        },
        {
          source: '/api/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: CDN_CONFIG.caching.api.headers['Cache-Control']
            }
          ]
        },
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: CDN_CONFIG.caching.static.headers['Cache-Control']
            }
          ]
        }
      ];
    },

    // Rewrites for CDN
    async rewrites() {
      if (!process.env.CDN_URL) return [];
      
      return [
        {
          source: '/cdn/:path*',
          destination: `${process.env.CDN_URL}/:path*`
        }
      ];
    },

    // Webpack configuration for optimization
    webpack: (config, { dev, isServer }) => {
      // Production optimizations
      if (!dev) {
        // Bundle analyzer (optional)
        if (process.env.ANALYZE === 'true') {
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html'
            })
          );
        }

        // Compression
        const CompressionPlugin = require('compression-webpack-plugin');
        config.plugins.push(
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8
          })
        );
      }

      return config;
    },

    // Experimental features
    experimental: {
      // Modern JavaScript output
      modern: true,
      // Optimize CSS
      optimizeCss: true,
      // Optimize images
      optimizeImages: true,
      // Server components (if using React 18+)
      serverComponents: false
    },

    // Output configuration
    output: 'standalone',
    
    // Trailing slash
    trailingSlash: false,
    
    // Power by header
    poweredByHeader: false
  };

  return config;
};

// =====================================================
// CDN UTILITY FUNCTIONS
// =====================================================
const CDN_UTILS = {
  // Get CDN URL for asset
  getAssetUrl: (path) => {
    if (!process.env.CDN_URL || process.env.NODE_ENV !== 'production') {
      return path;
    }
    return `${process.env.CDN_URL}${path}`;
  },

  // Get optimized image URL
  getImageUrl: (src, { width, quality = 85, format = 'webp' } = {}) => {
    if (!src) return '';
    
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    params.set('q', quality.toString());
    params.set('f', format);
    
    const baseUrl = CDN_UTILS.getAssetUrl(src);
    return `${baseUrl}?${params.toString()}`;
  },

  // Preload critical resources
  preloadResources: () => {
    if (typeof window === 'undefined') return;
    
    // Preload fonts
    CDN_CONFIG.assets.fonts.preload.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = CDN_UTILS.getAssetUrl(font);
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  },

  // Purge CDN cache
  purgeCache: async (paths = []) => {
    if (process.env.CDN_PROVIDER === 'cloudflare') {
      return await purgeCloudflarCache(paths);
    } else if (process.env.CDN_PROVIDER === 'aws') {
      return await purgeCloudFrontCache(paths);
    }
  }
};

// Cloudflare cache purging
const purgeCloudflarCache = async (paths) => {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) {
    throw new Error('Cloudflare credentials not configured');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: paths.length > 0 ? paths : undefined,
        purge_everything: paths.length === 0
      })
    }
  );

  return await response.json();
};

// CloudFront cache invalidation
const purgeCloudFrontCache = async (paths) => {
  // This would require AWS SDK implementation
  // Placeholder for CloudFront invalidation
  console.log('CloudFront cache invalidation not implemented');
  return { success: false, message: 'Not implemented' };
};

// =====================================================
// PERFORMANCE MONITORING
// =====================================================
const PERFORMANCE_MONITOR = {
  // Initialize performance monitoring
  init: () => {
    if (typeof window === 'undefined' || !CDN_CONFIG.monitoring.metrics.coreWebVitals) {
      return;
    }

    // Web Vitals monitoring
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(PERFORMANCE_MONITOR.sendMetric);
      getFID(PERFORMANCE_MONITOR.sendMetric);
      getFCP(PERFORMANCE_MONITOR.sendMetric);
      getLCP(PERFORMANCE_MONITOR.sendMetric);
      getTTFB(PERFORMANCE_MONITOR.sendMetric);
    });
  },

  // Send metric to analytics
  sendMetric: (metric) => {
    if (Math.random() > CDN_CONFIG.monitoring.reporting.sampleRate) {
      return; // Skip based on sample rate
    }

    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now()
    });

    // Use sendBeacon if available, fallback to fetch
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(CDN_CONFIG.monitoring.reporting.endpoint, body);
    } else {
      fetch(CDN_CONFIG.monitoring.reporting.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(console.error);
    }
  }
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  CDN_CONFIG,
  CDN_UTILS,
  PERFORMANCE_MONITOR,
  getNextConfig
};

// =====================================================
// USAGE EXAMPLES
// =====================================================
/*
// In next.config.js:
const { getNextConfig } = require('./deployment/cdn-config');
module.exports = getNextConfig();

// In React components:
import { CDN_UTILS } from '../deployment/cdn-config';

const MyComponent = () => {
  const imageUrl = CDN_UTILS.getImageUrl('/images/loft.jpg', { 
    width: 800, 
    quality: 85, 
    format: 'webp' 
  });
  
  return <img src={imageUrl} alt="Loft" />;
};

// In _app.js:
import { PERFORMANCE_MONITOR, CDN_UTILS } from '../deployment/cdn-config';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    PERFORMANCE_MONITOR.init();
    CDN_UTILS.preloadResources();
  }, []);
  
  return <Component {...pageProps} />;
}
*/