'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useAnimationSystem';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  showLoadingAnimation?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw',
  onLoad,
  onError,
  fallbackSrc,
  showLoadingAnimation = true,
  objectFit = 'cover'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imageRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (width: number = 10, height: number = 10) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple gradient blur placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(0.5, '#e5e7eb');
      gradient.addColorStop(1, '#d1d5db');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL();
  };

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL();

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.();
    }
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imageRef.current || priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Image is in viewport, start loading
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    observer.observe(imageRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Loading animation variants
  const loadingVariants = {
    initial: { opacity: 1 },
    exit: {
      opacity: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3
      }
    }
  };

  const imageVariants = {
    initial: { opacity: 0, scale: 1.1 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: "easeOut"
      }
    }
  };

  // Generate a simple SVG placeholder
  const generatePlaceholderSVG = (text: string = 'Image') => {
    const svg = `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">🏠 ${text}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Error fallback component
  const ErrorFallback = () => {
    const placeholderSrc = generatePlaceholderSVG(alt.split(' ').slice(0, 2).join(' ') || 'Loft');
    
    return (
      <div className="w-full h-full relative">
        <Image
          src={placeholderSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className="object-cover"
          quality={75}
        />
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <div className="text-2xl mb-2">🖼️</div>
            <p className="text-sm opacity-80">Image placeholder</p>
          </div>
        </div>
      </div>
    );
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <motion.div
      className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer rounded-lg"
      variants={loadingVariants}
      initial="initial"
      exit="exit"
    >
      <div className="w-full h-full flex items-center justify-center">
        {showLoadingAnimation && !prefersReducedMotion && (
          <motion.div
            className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
      </div>
    </motion.div>
  );

  if (hasError && (!fallbackSrc || currentSrc === fallbackSrc)) {
    return <ErrorFallback />;
  }

  return (
    <div ref={imageRef} className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {isLoading && showLoadingAnimation && (
          <motion.div
            key="loading"
            className="absolute inset-0 z-10"
            variants={loadingVariants}
            initial="initial"
            exit="exit"
          >
            <LoadingSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={imageVariants}
        initial="initial"
        animate={!isLoading ? "animate" : "initial"}
        className="w-full h-full"
      >
        <Image
          src={currentSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={`${objectFit === 'cover' ? 'object-cover' : 
                     objectFit === 'contain' ? 'object-contain' :
                     objectFit === 'fill' ? 'object-fill' :
                     objectFit === 'none' ? 'object-none' :
                     'object-scale-down'} transition-opacity duration-300`}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
        />
      </motion.div>
    </div>
  );
}

// Specialized image components
export function HeroImage({ src, alt, className = '', ...props }: Omit<OptimizedImageProps, 'priority' | 'quality'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      priority={true}
      quality={90}
      {...props}
    />
  );
}

export function CarouselImage({ src, alt, className = '', ...props }: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      quality={85}
      showLoadingAnimation={true}
      {...props}
    />
  );
}

export function ThumbnailImage({ src, alt, className = '', ...props }: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      quality={75}
      showLoadingAnimation={false}
      {...props}
    />
  );
}

// Image preloader utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch image preloader
export const preloadImages = async (srcs: string[]): Promise<void> => {
  try {
    await Promise.all(srcs.map(preloadImage));
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
};