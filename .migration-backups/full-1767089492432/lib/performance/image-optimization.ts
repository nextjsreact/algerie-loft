/**
 * Image Optimization Utilities for Dual-Audience Homepage
 * Provides WebP format support, lazy loading, and responsive images
 */

import { useState, useEffect, useRef } from 'react';

// Image format detection and WebP support
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Image optimization configuration
export interface ImageOptimizationConfig {
  quality: number;
  format: 'webp' | 'avif' | 'auto';
  sizes: string;
  priority: boolean;
  lazy: boolean;
  placeholder: 'blur' | 'empty';
  blurDataURL?: string;
}

// Default optimization settings for different use cases
export const IMAGE_CONFIGS = {
  hero: {
    quality: 90,
    format: 'auto' as const,
    sizes: '100vw',
    priority: true,
    lazy: false,
    placeholder: 'blur' as const,
  },
  loftCard: {
    quality: 85,
    format: 'auto' as const,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    priority: false,
    lazy: true,
    placeholder: 'blur' as const,
  },
  thumbnail: {
    quality: 80,
    format: 'auto' as const,
    sizes: '(max-width: 768px) 50vw, 25vw',
    priority: false,
    lazy: true,
    placeholder: 'empty' as const,
  },
  background: {
    quality: 75,
    format: 'auto' as const,
    sizes: '100vw',
    priority: false,
    lazy: true,
    placeholder: 'blur' as const,
  }
} as const;

// Generate responsive image sources
export const generateImageSources = (
  basePath: string,
  config: ImageOptimizationConfig
) => {
  const breakpoints = [640, 768, 1024, 1280, 1920];
  const formats = config.format === 'auto' ? ['avif', 'webp'] : [config.format];
  
  return formats.map(format => ({
    type: `image/${format}`,
    srcSet: breakpoints
      .map(width => `${basePath}?format=${format}&width=${width}&quality=${config.quality} ${width}w`)
      .join(', ')
  }));
};

// Lazy loading hook with Intersection Observer
export const useLazyLoading = (enabled: boolean = true) => {
  const [isLoaded, setIsLoaded] = useState(!enabled);
  const [isInView, setIsInView] = useState(!enabled);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!enabled || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [enabled, isInView]);

  const handleLoad = () => setIsLoaded(true);

  return {
    imgRef,
    isLoaded,
    isInView,
    handleLoad,
    shouldLoad: isInView || !enabled
  };
};

// Progressive image loading with blur effect
export const useProgressiveImage = (
  lowQualitySrc: string,
  highQualitySrc: string,
  lazy: boolean = true
) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc);
  const [isLoading, setIsLoading] = useState(true);
  const { isInView, imgRef } = useLazyLoading(lazy);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(highQualitySrc);
      setIsLoading(false);
    };
    img.src = highQualitySrc;
  }, [isInView, highQualitySrc]);

  return {
    src: currentSrc,
    isLoading,
    imgRef
  };
};

// Generate blur placeholder from image
export const generateBlurPlaceholder = (
  imagePath: string,
  width: number = 10,
  quality: number = 10
): string => {
  return `${imagePath}?width=${width}&quality=${quality}&blur=10`;
};

// Image preloading utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch image preloading for critical images
export const preloadCriticalImages = async (imagePaths: string[]): Promise<void> => {
  const preloadPromises = imagePaths.map(path => preloadImage(path));
  
  try {
    await Promise.all(preloadPromises);
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
};

// Image optimization for different screen densities
export const getOptimizedImageUrl = (
  basePath: string,
  width: number,
  options: Partial<ImageOptimizationConfig> = {}
): string => {
  const config = { ...IMAGE_CONFIGS.loftCard, ...options };
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const optimizedWidth = Math.round(width * devicePixelRatio);
  
  return `${basePath}?width=${optimizedWidth}&quality=${config.quality}&format=${config.format}`;
};

// Critical image detection for above-the-fold content
export const isCriticalImage = (element: HTMLImageElement): boolean => {
  if (typeof window === 'undefined') return false;
  
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  // Consider image critical if it's in the first viewport
  return rect.top < viewportHeight;
};

// Image loading performance metrics
export interface ImageLoadingMetrics {
  loadTime: number;
  size: number;
  format: string;
  cached: boolean;
}

export const measureImageLoading = (
  imageSrc: string
): Promise<ImageLoadingMetrics> => {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      
      // Try to get image size (approximate)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const size = imageData.data.length;
        
        resolve({
          loadTime,
          size,
          format: imageSrc.includes('.webp') ? 'webp' : 
                  imageSrc.includes('.avif') ? 'avif' : 'jpeg',
          cached: loadTime < 50 // Assume cached if very fast
        });
      } else {
        resolve({
          loadTime,
          size: 0,
          format: 'unknown',
          cached: loadTime < 50
        });
      }
    };
    
    img.onerror = reject;
    img.src = imageSrc;
  });
};