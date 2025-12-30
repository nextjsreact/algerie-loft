'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useProgressiveImageLoading,
  IMAGE_OPTIMIZATION_PRESETS,
  generateResponsiveSrcSet,
  preloadCriticalImages,
  type ImageOptimizationOptions
} from '@/lib/performance/enhanced-image-optimization';
import { cn } from '@/lib/utils';

// Enhanced image component props
export interface EnhancedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  audienceType?: 'guest' | 'owner' | 'shared';
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  lazy?: boolean;
  showLoadingAnimation?: boolean;
  optimizationPreset?: keyof typeof IMAGE_OPTIMIZATION_PRESETS;
}

export function EnhancedImage({
  src,
  alt,
  width,
  height,
  className,
  audienceType = 'shared',
  priority = false,
  quality,
  fill = false,
  sizes,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc = '/placeholder.jpg',
  lazy = true,
  showLoadingAnimation = true,
  optimizationPreset
}: EnhancedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy || priority);
  const imageRef = useRef<HTMLDivElement>(null);

  // Determine optimization preset based on audience type
  const getOptimizationPreset = (): keyof typeof IMAGE_OPTIMIZATION_PRESETS => {
    if (optimizationPreset) return optimizationPreset;
    
    if (priority) return 'hero';
    if (audienceType === 'guest') return 'guestLoftCard';
    if (audienceType === 'owner') return 'ownerSection';
    return 'guestLoftCard'; // Default
  };

  const preset = IMAGE_OPTIMIZATION_PRESETS[getOptimizationPreset()];
  
  // Use progressive image loading
  const {
    elementRef,
    src: optimizedSrc,
    isLoading,
    hasError: loadingError,
    isIntersecting
  } = useProgressiveImageLoading(src, {
    ...preset,
    quality: quality || preset.quality,
    lazy: lazy && !priority,
    placeholder,
    blurDataURL
  });

  // Handle visibility for lazy loading
  useEffect(() => {
    if (isIntersecting || priority) {
      setIsVisible(true);
    }
  }, [isIntersecting, priority]);

  // Handle load event
  const handleLoad = () => {
    onLoad?.();
  };

  // Handle error event
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <motion.div
      className={cn(
        "absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700",
        showLoadingAnimation && "animate-pulse"
      )}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </motion.div>
  );

  // Error fallback component
  const ErrorFallback = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <svg
          className="mx-auto h-8 w-8 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-xs">Image unavailable</p>
      </div>
    </div>
  );

  return (
    <div
      ref={elementRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Main image */}
      {isVisible && (
        <Image
          src={hasError ? fallbackSrc : optimizedSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality || preset.quality}
          sizes={sizes || preset.sizes}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-all duration-500 ease-out",
            isLoading ? "opacity-0 scale-105" : "opacity-100 scale-100",
            hasError && "grayscale",
            fill ? "object-cover" : ""
          )}
        />
      )}

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && showLoadingAnimation && (
          <LoadingSkeleton />
        )}
      </AnimatePresence>

      {/* Error state */}
      {(hasError || loadingError) && <ErrorFallback />}

      {/* Audience-specific overlay for analytics */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
          {audienceType}
        </div>
      )}
    </div>
  );
}

// Specialized image components for different use cases
export function GuestHeroImage({ 
  src, 
  alt, 
  className, 
  ...props 
}: Omit<EnhancedImageProps, 'audienceType' | 'optimizationPreset'>) {
  return (
    <EnhancedImage
      src={src}
      alt={alt}
      fill
      priority
      audienceType="guest"
      optimizationPreset="hero"
      className={cn("w-full h-[400px] md:h-[500px] lg:h-[600px]", className)}
      {...props}
    />
  );
}

export function GuestLoftCardImage({ 
  src, 
  alt, 
  className, 
  ...props 
}: Omit<EnhancedImageProps, 'audienceType' | 'optimizationPreset'>) {
  return (
    <EnhancedImage
      src={src}
      alt={alt}
      fill
      audienceType="guest"
      optimizationPreset="guestLoftCard"
      className={cn("aspect-[4/3] w-full", className)}
      {...props}
    />
  );
}

export function OwnerSectionImage({ 
  src, 
  alt, 
  className, 
  ...props 
}: Omit<EnhancedImageProps, 'audienceType' | 'optimizationPreset'>) {
  return (
    <EnhancedImage
      src={src}
      alt={alt}
      fill
      audienceType="owner"
      optimizationPreset="ownerSection"
      className={cn("aspect-[16/9] w-full", className)}
      {...props}
    />
  );
}

export function ThumbnailImage({ 
  src, 
  alt, 
  className, 
  ...props 
}: Omit<EnhancedImageProps, 'audienceType' | 'optimizationPreset'>) {
  return (
    <EnhancedImage
      src={src}
      alt={alt}
      width={150}
      height={150}
      audienceType="shared"
      optimizationPreset="thumbnail"
      className={cn("w-24 h-24 rounded-lg", className)}
      {...props}
    />
  );
}

// Image gallery component with lazy loading and optimization
export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  audienceType?: 'guest' | 'owner' | 'shared';
  className?: string;
  onImageClick?: (index: number) => void;
}

export function OptimizedImageGallery({
  images,
  audienceType = 'guest',
  className,
  onImageClick
}: ImageGalleryProps) {
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());

  // Preload critical images (first 3)
  useEffect(() => {
    const criticalImages = images.slice(0, 3).map(img => img.src);
    preloadCriticalImages(criticalImages);
  }, [images]);

  // Progressive preloading as user scrolls
  const handleImageVisible = (index: number) => {
    if (!preloadedImages.has(index)) {
      setPreloadedImages(prev => new Set([...prev, index]));
      
      // Preload next 2 images
      const nextImages = images.slice(index + 1, index + 3).map(img => img.src);
      if (nextImages.length > 0) {
        preloadCriticalImages(nextImages);
      }
    }
  };

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {images.map((image, index) => (
        <motion.div
          key={index}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onImageClick?.(index)}
        >
          <EnhancedImage
            src={image.src}
            alt={image.alt}
            fill
            audienceType={audienceType}
            priority={index < 3}
            lazy={index >= 3}
            className="aspect-square rounded-lg"
            onLoad={() => handleImageVisible(index)}
          />
          {image.caption && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
              {image.caption}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Performance monitoring hook for images
export const useImagePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<{
    totalImages: number;
    loadedImages: number;
    failedImages: number;
    averageLoadTime: number;
  }>({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0
  });

  const trackImageLoad = (loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      loadedImages: prev.loadedImages + 1,
      averageLoadTime: (prev.averageLoadTime * (prev.loadedImages - 1) + loadTime) / prev.loadedImages
    }));
  };

  const trackImageError = () => {
    setMetrics(prev => ({
      ...prev,
      failedImages: prev.failedImages + 1
    }));
  };

  const registerImage = () => {
    setMetrics(prev => ({
      ...prev,
      totalImages: prev.totalImages + 1
    }));
  };

  return {
    metrics,
    trackImageLoad,
    trackImageError,
    registerImage
  };
};