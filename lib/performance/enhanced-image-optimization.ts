/**
 * Enhanced Image Optimization for Dual-Audience Homepage
 * Implements WebP format, lazy loading, and responsive images with caching
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// WebP support detection with caching
let webpSupported: boolean | null = null;

export const detectWebPSupport = async (): Promise<boolean> => {
  if (webpSupported !== null) return webpSupported;
  
  if (typeof window === 'undefined') {
    webpSupported = false;
    return false;
  }

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      webpSupported = webP.height === 2;
      resolve(webpSupported);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// AVIF support detection
let avifSupported: boolean | null = null;

export const detectAVIFSupport = async (): Promise<boolean> => {
  if (avifSupported !== null) return avifSupported;
  
  if (typeof window === 'undefined') {
    avifSupported = false;
    return false;
  }

  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      avifSupported = avif.height === 2;
      resolve(avifSupported);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

// Image format optimization configuration
export interface ImageOptimizationOptions {
  quality: number;
  format: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  sizes: string;
  priority: boolean;
  lazy: boolean;
  placeholder: 'blur' | 'empty';
  blurDataURL?: string;
  fallbackFormat?: string;
}

// Predefined configurations for different use cases
export const IMAGE_OPTIMIZATION_PRESETS = {
  hero: {
    quality: 90,
    format: 'auto' as const,
    sizes: '100vw',
    priority: true,
    lazy: false,
    placeholder: 'blur' as const,
    fallbackFormat: 'jpeg'
  },
  guestLoftCard: {
    quality: 85,
    format: 'auto' as const,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    priority: false,
    lazy: true,
    placeholder: 'blur' as const,
    fallbackFormat: 'jpeg'
  },
  ownerSection: {
    quality: 80,
    format: 'auto' as const,
    sizes: '(max-width: 768px) 100vw, 50vw',
    priority: false,
    lazy: true,
    placeholder: 'blur' as const,
    fallbackFormat: 'jpeg'
  },
  thumbnail: {
    quality: 75,
    format: 'auto' as const,
    sizes: '(max-width: 768px) 50vw, 25vw',
    priority: false,
    lazy: true,
    placeholder: 'empty' as const,
    fallbackFormat: 'jpeg'
  }
} as const;

// Generate optimized image URL with format detection
export const getOptimizedImageUrl = async (
  originalUrl: string,
  width: number,
  options: Partial<ImageOptimizationOptions> = {}
): Promise<string> => {
  const config = { ...IMAGE_OPTIMIZATION_PRESETS.guestLoftCard, ...options };
  
  // Detect best format if auto is selected
  let format = config.format;
  if (format === 'auto') {
    const supportsAVIF = await detectAVIFSupport();
    const supportsWebP = await detectWebPSupport();
    
    if (supportsAVIF) {
      format = 'avif';
    } else if (supportsWebP) {
      format = 'webp';
    } else {
      format = config.fallbackFormat || 'jpeg';
    }
  }
  
  // Handle device pixel ratio
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const optimizedWidth = Math.round(width * Math.min(devicePixelRatio, 2)); // Cap at 2x for performance
  
  // Generate optimized URL (assuming Next.js image optimization)
  const params = new URLSearchParams({
    w: optimizedWidth.toString(),
    q: config.quality.toString(),
    f: format
  });
  
  return `${originalUrl}?${params.toString()}`;
};

// Advanced lazy loading hook with intersection observer
export const useAdvancedLazyLoading = (options: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
} = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '100px', // Increased for better UX
    triggerOnce = true
  } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasIntersected)) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && triggerOnce) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasIntersected]);
  
  return {
    elementRef,
    isIntersecting: isIntersecting || hasIntersected,
    hasIntersected
  };
};

// Progressive image loading with blur-to-sharp transition
export const useProgressiveImageLoading = (
  src: string,
  options: Partial<ImageOptimizationOptions> = {}
) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { elementRef, isIntersecting } = useAdvancedLazyLoading({
    triggerOnce: true,
    rootMargin: '50px'
  });
  
  const config = { ...IMAGE_OPTIMIZATION_PRESETS.guestLoftCard, ...options };
  
  // Generate blur placeholder
  const blurPlaceholder = config.placeholder === 'blur' 
    ? config.blurDataURL || generateBlurDataURL(src)
    : '';
  
  useEffect(() => {
    if (!isIntersecting && config.lazy) return;
    
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Get optimized URL
        const optimizedSrc = await getOptimizedImageUrl(src, 800, config);
        
        // Preload the image
        const img = new Image();
        img.onload = () => {
          setCurrentSrc(optimizedSrc);
          setIsLoading(false);
        };
        img.onerror = () => {
          setHasError(true);
          setIsLoading(false);
          // Fallback to original
          setCurrentSrc(src);
        };
        img.src = optimizedSrc;
        
      } catch (error) {
        setHasError(true);
        setIsLoading(false);
        setCurrentSrc(src);
      }
    };
    
    loadImage();
  }, [src, isIntersecting, config.lazy]);
  
  return {
    elementRef,
    src: currentSrc || blurPlaceholder,
    isLoading,
    hasError,
    isIntersecting
  };
};

// Generate blur data URL for placeholder
export const generateBlurDataURL = (src: string): string => {
  // Simple blur placeholder - in production, you might generate this server-side
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="10"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#f3f4f6" filter="url(#blur)"/>
    </svg>
  `)}`;
};

// Image preloading for critical resources
export const preloadCriticalImages = async (imagePaths: string[]): Promise<void> => {
  const preloadPromises = imagePaths.map(async (path) => {
    try {
      const optimizedUrl = await getOptimizedImageUrl(path, 1200, {
        priority: true,
        quality: 90
      });
      
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = optimizedUrl;
      });
    } catch (error) {
      console.warn(`Failed to preload image: ${path}`, error);
    }
  });
  
  try {
    await Promise.allSettled(preloadPromises);
  } catch (error) {
    console.warn('Some critical images failed to preload:', error);
  }
};

// Performance monitoring for images
export interface ImagePerformanceMetrics {
  loadTime: number;
  size: number;
  format: string;
  cached: boolean;
  renderTime: number;
}

export const measureImagePerformance = (
  imageSrc: string
): Promise<ImagePerformanceMetrics> => {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      const renderStart = performance.now();
      
      // Measure render time by drawing to canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        
        const renderTime = performance.now() - renderStart;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        resolve({
          loadTime,
          size: imageData.data.length,
          format: getImageFormat(imageSrc),
          cached: loadTime < 50,
          renderTime
        });
      } else {
        resolve({
          loadTime,
          size: 0,
          format: getImageFormat(imageSrc),
          cached: loadTime < 50,
          renderTime: 0
        });
      }
    };
    
    img.onerror = reject;
    img.src = imageSrc;
  });
};

// Helper to detect image format from URL
const getImageFormat = (url: string): string => {
  if (url.includes('f=avif') || url.includes('.avif')) return 'avif';
  if (url.includes('f=webp') || url.includes('.webp')) return 'webp';
  if (url.includes('.png')) return 'png';
  if (url.includes('.gif')) return 'gif';
  return 'jpeg';
};

// Responsive image srcSet generation
export const generateResponsiveSrcSet = async (
  baseSrc: string,
  breakpoints: number[] = [640, 768, 1024, 1280, 1920],
  options: Partial<ImageOptimizationOptions> = {}
): Promise<string> => {
  const srcSetPromises = breakpoints.map(async (width) => {
    const optimizedUrl = await getOptimizedImageUrl(baseSrc, width, options);
    return `${optimizedUrl} ${width}w`;
  });
  
  const srcSetEntries = await Promise.all(srcSetPromises);
  return srcSetEntries.join(', ');
};