/**
 * Performance Optimizations Test Suite
 * Tests the implementation of image optimization, caching, and code splitting
 */

import { 
  detectWebPSupport, 
  detectAVIFSupport,
  getOptimizedImageUrl,
  IMAGE_OPTIMIZATION_PRESETS
} from '@/lib/performance/enhanced-image-optimization';

import { 
  EnhancedCache,
  CacheManager,
  CACHE_CONFIGS
} from '@/lib/performance/enhanced-caching';

import { 
  detectAudience,
  CodeSplittingUtils
} from '@/lib/performance/code-splitting';

// Mock window and performance APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  getEntriesByType: jest.fn(() => []),
  mark: jest.fn(),
  measure: jest.fn()
};

const mockIntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

// Setup mocks
beforeAll(() => {
  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true
  });

  Object.defineProperty(global, 'IntersectionObserver', {
    value: mockIntersectionObserver,
    writable: true
  });

  Object.defineProperty(global, 'Image', {
    value: class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      
      set src(value: string) {
        // Simulate successful load for test images
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
      
      get height() { return 2; } // For WebP detection
    },
    writable: true
  });
});

describe('Enhanced Image Optimization', () => {
  describe('Format Detection', () => {
    it('should detect WebP support', async () => {
      const supportsWebP = await detectWebPSupport();
      expect(typeof supportsWebP).toBe('boolean');
    });

    it('should detect AVIF support', async () => {
      const supportsAVIF = await detectAVIFSupport();
      expect(typeof supportsAVIF).toBe('boolean');
    });
  });

  describe('Image URL Optimization', () => {
    it('should generate optimized image URLs', async () => {
      const originalUrl = '/test-image.jpg';
      const optimizedUrl = await getOptimizedImageUrl(originalUrl, 800);
      
      expect(optimizedUrl).toContain('w=800');
      expect(optimizedUrl).toContain('q=');
    });

    it('should use correct presets for different use cases', () => {
      expect(IMAGE_OPTIMIZATION_PRESETS.hero.priority).toBe(true);
      expect(IMAGE_OPTIMIZATION_PRESETS.hero.quality).toBe(90);
      
      expect(IMAGE_OPTIMIZATION_PRESETS.guestLoftCard.lazy).toBe(true);
      expect(IMAGE_OPTIMIZATION_PRESETS.guestLoftCard.quality).toBe(85);
    });
  });
});

describe('Enhanced Caching System', () => {
  let cache: EnhancedCache<string>;

  beforeEach(() => {
    cache = new EnhancedCache<string>('test', {
      ttl: 1000,
      maxSize: 3,
      strategy: 'lru',
      persistent: false
    });
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should handle cache expiration', (done) => {
      cache.set('expiring', 'value');
      
      setTimeout(() => {
        expect(cache.get('expiring')).toBeNull();
        done();
      }, 1100);
    });
  });

  describe('Cache Eviction', () => {
    it('should evict entries when max size is reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1'); // Access to increase count
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });
});

describe('Cache Manager', () => {
  it('should provide different cache instances for different types', () => {
    const manager = CacheManager.getInstance();
    
    const guestCache = manager.getCache('guestData');
    const ownerCache = manager.getCache('ownerData');
    
    expect(guestCache).not.toBe(ownerCache);
  });

  it('should use correct configurations for different cache types', () => {
    expect(CACHE_CONFIGS.guestData.ttl).toBe(15 * 60 * 1000);
    expect(CACHE_CONFIGS.ownerData.ttl).toBe(30 * 60 * 1000);
    expect(CACHE_CONFIGS.staticContent.persistent).toBe(true);
  });
});

describe('Code Splitting Utilities', () => {
  describe('Audience Detection', () => {
    beforeEach(() => {
      // Mock localStorage
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn()
        },
        writable: true
      });

      // Mock document
      Object.defineProperty(global, 'document', {
        value: {
          referrer: ''
        },
        writable: true
      });

      // Mock window.location
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            search: ''
          }
        },
        writable: true
      });
    });

    it('should detect audience from URL parameters', () => {
      (global.window as any).location.search = '?audience=guest';
      const audience = detectAudience();
      expect(audience).toBe('guest');
    });

    it('should default to both when no specific audience is detected', () => {
      (global.window as any).location.search = '';
      (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
      (global.document as any).referrer = '';
      
      const audience = detectAudience();
      expect(audience).toBe('both');
    });
  });

  describe('Component Loading', () => {
    it('should provide utilities for code splitting', () => {
      expect(CodeSplittingUtils.detectAudience).toBeDefined();
      expect(CodeSplittingUtils.preloadAudienceComponents).toBeDefined();
      expect(CodeSplittingUtils.getRouteComponents).toBeDefined();
    });
  });
});

describe('Performance Integration', () => {
  it('should work together seamlessly', async () => {
    // Test that all systems can be initialized together
    const manager = CacheManager.getInstance();
    const cache = manager.getCache('staticContent');
    
    // Cache some optimized image URLs
    const imageUrl = await getOptimizedImageUrl('/test.jpg', 800);
    cache.set('optimized_image', imageUrl);
    
    // Verify cached data
    const cachedUrl = cache.get('optimized_image');
    expect(cachedUrl).toBe(imageUrl);
    
    // Test audience detection
    const audience = detectAudience();
    expect(['guest', 'owner', 'both']).toContain(audience);
  });
});