/**
 * Logo Asset Management System
 * Handles logo asset verification, optimization, and fallback management
 */

export interface LogoConfig {
  primary: string;
  fallbacks: string[];
  placeholder: string;
  textFallback: {
    text: string;
    className: string;
  };
}

export interface LogoAssetManager {
  verifyAssetExists(src: string): Promise<boolean>;
  getOptimalFormat(basePath: string): Promise<string>;
  preloadCriticalLogos(): Promise<void>;
}

// Default logo configuration for Loft Algérie
export const DEFAULT_LOGO_CONFIG: LogoConfig = {
  primary: '/logo.jpg',
  fallbacks: ['/logo.png', '/logo-temp.svg', '/logo-fallback.svg', '/placeholder-logo.svg'],
  placeholder: '/placeholder-logo.svg',
  textFallback: {
    text: 'LOFT ALGÉRIE',
    className: 'font-bold text-yellow-400 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent'
  }
};

class LogoAssetManagerImpl implements LogoAssetManager {
  private cache = new Map<string, boolean>();
  private preloadPromises = new Map<string, Promise<boolean>>();

  /**
   * Verify if a logo asset exists and can be loaded
   */
  async verifyAssetExists(src: string): Promise<boolean> {
    // Check cache first
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Check if already being verified
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src)!;
    }

    // Create verification promise
    const verificationPromise = this.performAssetVerification(src);
    this.preloadPromises.set(src, verificationPromise);

    try {
      const exists = await verificationPromise;
      this.cache.set(src, exists);
      this.preloadPromises.delete(src);
      return exists;
    } catch (error) {
      this.preloadPromises.delete(src);
      this.cache.set(src, false);
      console.error(`Asset verification failed for ${src}:`, error);
      return false;
    }
  }

  /**
   * Perform the actual asset verification
   */
  private async performAssetVerification(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        console.log(`✅ Logo asset verified: ${src}`);
        resolve(true);
      };

      img.onerror = () => {
        cleanup();
        console.warn(`❌ Logo asset not found: ${src}`);
        resolve(false);
      };

      // Set timeout for verification
      setTimeout(() => {
        cleanup();
        console.warn(`⏰ Logo asset verification timeout: ${src}`);
        resolve(false);
      }, 3000);

      img.src = src;
    });
  }

  /**
   * Get the optimal logo format from available options
   */
  async getOptimalFormat(basePath: string): Promise<string> {
    const formats = ['svg', 'png', 'jpg', 'webp'];
    const basePathWithoutExt = basePath.replace(/\.[^/.]+$/, '');

    for (const format of formats) {
      const testPath = `${basePathWithoutExt}.${format}`;
      const exists = await this.verifyAssetExists(testPath);
      
      if (exists) {
        console.log(`🎯 Optimal logo format found: ${testPath}`);
        return testPath;
      }
    }

    console.warn(`⚠️ No optimal format found for ${basePath}, using original`);
    return basePath;
  }

  /**
   * Preload critical logos for better performance
   */
  async preloadCriticalLogos(): Promise<void> {
    const criticalLogos = [
      DEFAULT_LOGO_CONFIG.primary,
      ...DEFAULT_LOGO_CONFIG.fallbacks.slice(0, 2), // Only preload first 2 fallbacks
    ];

    console.log('🚀 Preloading critical logos...');
    
    const preloadPromises = criticalLogos.map(async (src) => {
      try {
        const exists = await this.verifyAssetExists(src);
        if (exists) {
          // Actually preload the image
          const img = new Image();
          img.src = src;
          console.log(`✅ Preloaded: ${src}`);
        }
      } catch (error) {
        console.error(`❌ Failed to preload: ${src}`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('🎉 Logo preloading completed');
  }

  /**
   * Get logo configuration with verified assets
   */
  async getVerifiedLogoConfig(): Promise<LogoConfig> {
    const config = { ...DEFAULT_LOGO_CONFIG };
    
    // Verify primary logo
    const primaryExists = await this.verifyAssetExists(config.primary);
    if (!primaryExists) {
      console.warn(`Primary logo not found: ${config.primary}`);
    }

    // Verify and filter fallbacks
    const verifiedFallbacks: string[] = [];
    for (const fallback of config.fallbacks) {
      const exists = await this.verifyAssetExists(fallback);
      if (exists) {
        verifiedFallbacks.push(fallback);
      }
    }

    config.fallbacks = verifiedFallbacks;
    
    console.log('📋 Verified logo config:', {
      primary: config.primary,
      primaryExists,
      fallbackCount: verifiedFallbacks.length
    });

    return config;
  }

  /**
   * Clear the asset cache (useful for testing or when assets change)
   */
  clearCache(): void {
    this.cache.clear();
    this.preloadPromises.clear();
    console.log('🧹 Logo asset cache cleared');
  }
}

// Export singleton instance
export const logoAssetManager = new LogoAssetManagerImpl();

// Utility function to get logo sources with fallbacks
export async function getLogoSources(primarySrc?: string): Promise<string[]> {
  const config = await logoAssetManager.getVerifiedLogoConfig();
  const sources = primarySrc ? [primarySrc] : [config.primary];
  
  return [...sources, ...config.fallbacks];
}

// Utility function to preload logos on app initialization
export async function initializeLogoAssets(): Promise<void> {
  try {
    await logoAssetManager.preloadCriticalLogos();
  } catch (error) {
    console.error('Failed to initialize logo assets:', error);
  }
}