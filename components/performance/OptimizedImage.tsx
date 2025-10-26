'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  OptimizedImageProps, 
  getImageConfig, 
  generateWebPSources, 
  createBlurDataURL,
  getImagePriority 
} from '@/lib/performance/image-optimization';

interface OptimizedImageComponentProps extends OptimizedImageProps {
  section?: string;
  index?: number;
  fallbackSrc?: string;
}

export default function OptimizedImage({
  src,
  alt,
  section = 'default',
  index = 0,
  priority,
  lazy = true,
  webpFallback = true,
  responsive = true,
  quality = 80,
  fallbackSrc,
  className,
  ...props
}: OptimizedImageComponentProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine image priority
  const imagePriority = priority ?? getImagePriority(section, index);
  
  // Get image configuration based on section
  const config = getImageConfig(section as 'hero' | 'loft-card' | 'thumbnail' | 'gallery');
  
  // Generate WebP sources if supported
  const { webp, fallback } = webpFallback ? generateWebPSources(src) : { webp: src, fallback: src };

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    // Try fallback source
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      return;
    }
    
    // Use WebP fallback
    if (imageSrc === webp && webp !== fallback) {
      setImageSrc(fallback);
      return;
    }
  };

  // Check WebP support and set appropriate source
  useEffect(() => {
    if (!webpFallback) return;

    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL('image/webp');
      return dataURL.indexOf('data:image/webp') === 0;
    };

    if (typeof window !== 'undefined') {
      const supportsWebP = checkWebPSupport();
      setImageSrc(supportsWebP ? webp : fallback);
    }
  }, [webp, fallback, webpFallback]);

  // Create blur placeholder
  const blurDataURL = createBlurDataURL();

  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Optimized Image */}
      <Image
        src={imageSrc}
        alt={alt}
        priority={imagePriority}
        quality={quality}
        placeholder="blur"
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...config}
        {...props}
      />

      {/* WebP Picture element for better browser support */}
      {webpFallback && !hasError && (
        <picture className="hidden">
          <source srcSet={webp} type="image/webp" />
          <source srcSet={fallback} type="image/jpeg" />
        </picture>
      )}
    </div>
  );
}

/**
 * Specialized image components for different use cases
 */

// Hero image component
export function HeroImage(props: Omit<OptimizedImageComponentProps, 'section'>) {
  return (
    <OptimizedImage
      {...props}
      section="hero"
      priority={true}
      quality={85}
      className={`w-full h-full object-cover ${props.className || ''}`}
    />
  );
}

// Loft card image component
export function LoftCardImage(props: Omit<OptimizedImageComponentProps, 'section'>) {
  return (
    <OptimizedImage
      {...props}
      section="loft-card"
      quality={80}
      className={`w-full h-48 object-cover rounded-lg ${props.className || ''}`}
    />
  );
}

// Thumbnail image component
export function ThumbnailImage(props: Omit<OptimizedImageComponentProps, 'section'>) {
  return (
    <OptimizedImage
      {...props}
      section="thumbnail"
      quality={75}
      className={`w-16 h-16 object-cover rounded-full ${props.className || ''}`}
    />
  );
}

// Gallery image component
export function GalleryImage(props: Omit<OptimizedImageComponentProps, 'section'>) {
  return (
    <OptimizedImage
      {...props}
      section="gallery"
      quality={90}
      className={`w-full h-auto object-cover ${props.className || ''}`}
    />
  );
}