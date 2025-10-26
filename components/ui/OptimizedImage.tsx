'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  useLazyLoading, 
  useProgressiveImage, 
  IMAGE_CONFIGS, 
  generateBlurPlaceholder,
  type ImageOptimizationConfig 
} from '@/lib/performance/image-optimization';

// Blur data URLs for different image sizes
export const BLUR_DATA_URLS = {
  small: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  medium: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  large: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAMAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
};

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  config?: keyof typeof IMAGE_CONFIGS;
  lazy?: boolean;
  responsive?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  placeholder = 'empty',
  blurDataURL,
  config = 'loftCard',
  lazy = true,
  responsive = true,
  ...props
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imageConfig = IMAGE_CONFIGS[config];
  
  // Use lazy loading if enabled and not priority
  const shouldUseLazy = lazy && !priority;
  const { imgRef, isInView, shouldLoad } = useLazyLoading(shouldUseLazy);

  // Generate blur placeholder if needed
  const effectiveBlurDataURL = blurDataURL || 
    (placeholder === 'blur' ? generateBlurPlaceholder(src) : undefined);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Fallback image for errors
  const fallbackSrc = '/images/placeholder-loft.jpg';

  // Don't render until in view (for lazy loading)
  if (shouldUseLazy && !shouldLoad) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          ...style,
        }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Loading placeholder */}
      {!isLoaded && !imageError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{
            width: fill ? '100%' : width,
            height: fill ? '100%' : height,
          }}
        >
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {imageError ? (
        <div
          className="bg-gray-100 flex items-center justify-center text-gray-400"
          style={{
            width: fill ? '100%' : width,
            height: fill ? '100%' : height,
          }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🏠</div>
            <div className="text-sm">Image non disponible</div>
          </div>
        </div>
      ) : (
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality || imageConfig.quality}
          sizes={sizes || imageConfig.sizes}
          placeholder={placeholder}
          blurDataURL={effectiveBlurDataURL}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}

// Specialized components for different use cases
export function HeroImage(props: Omit<OptimizedImageProps, 'config' | 'priority'>) {
  return (
    <OptimizedImage
      {...props}
      config="hero"
      priority={true}
      lazy={false}
    />
  );
}

export function LoftCardImage(props: Omit<OptimizedImageProps, 'config'>) {
  return (
    <OptimizedImage
      {...props}
      config="loftCard"
    />
  );
}

export function ThumbnailImage(props: Omit<OptimizedImageProps, 'config'>) {
  return (
    <OptimizedImage
      {...props}
      config="thumbnail"
    />
  );
}

export function BackgroundImage(props: Omit<OptimizedImageProps, 'config'>) {
  return (
    <OptimizedImage
      {...props}
      config="background"
    />
  );
}

// Picture element for modern format support
interface ResponsivePictureProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  quality?: number;
}

export function ResponsivePicture({
  src,
  alt,
  width,
  height,
  className = '',
  sizes = '100vw',
  quality = 85,
}: ResponsivePictureProps) {
  const [imageError, setImageError] = useState(false);
  const baseName = src.replace(/\.[^/.]+$/, '');
  const extension = src.match(/\.[^/.]+$/)?.[0] || '.jpg';

  if (imageError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400">Image non disponible</span>
      </div>
    );
  }

  return (
    <picture className={className}>
      {/* AVIF format for modern browsers */}
      <source
        srcSet={`
          ${baseName}-sm.avif 640w,
          ${baseName}-md.avif 768w,
          ${baseName}-lg.avif 1024w,
          ${baseName}-xl.avif 1280w,
          ${baseName}.avif ${width}w
        `}
        sizes={sizes}
        type="image/avif"
      />
      
      {/* WebP format for broader support */}
      <source
        srcSet={`
          ${baseName}-sm.webp 640w,
          ${baseName}-md.webp 768w,
          ${baseName}-lg.webp 1024w,
          ${baseName}-xl.webp 1280w,
          ${baseName}.webp ${width}w
        `}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback to original format */}
      <img
        src={src}
        srcSet={`
          ${baseName}-sm${extension} 640w,
          ${baseName}-md${extension} 768w,
          ${baseName}-lg${extension} 1024w,
          ${baseName}-xl${extension} 1280w,
          ${src} ${width}w
        `}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onError={() => setImageError(true)}
        className="w-full h-full object-cover"
      />
    </picture>
  );
}