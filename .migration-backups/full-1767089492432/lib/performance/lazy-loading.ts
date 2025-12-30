/**
 * Utilitaires pour le lazy loading et l'optimisation des composants
 */

import { lazy, ComponentType, Suspense } from 'react';
import { LAZY_LOADING_CONFIG } from './optimization-config';

/**
 * Crée un composant lazy avec un fallback personnalisé
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <ComponentSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Composant skeleton par défaut
 */
function ComponentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  );
}

/**
 * Hook pour l'intersection observer (lazy loading d'éléments)
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const [ref, setRef] = React.useState<Element | null>(null);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(callback, {
      rootMargin: LAZY_LOADING_CONFIG.rootMargin,
      threshold: LAZY_LOADING_CONFIG.threshold,
      ...options
    });

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback, options]);

  return setRef;
}

/**
 * Hook pour le lazy loading d'images
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);

  const imgRef = useIntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }
  );

  React.useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isInView, src]);

  return { imgRef, imageSrc, isLoaded };
}

/**
 * Composant d'image lazy optimisé
 */
interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder, 
  className = '',
  width,
  height 
}: LazyImageProps) {
  const { imgRef, imageSrc, isLoaded } = useLazyImage(src, placeholder);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        width={width}
        height={height}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}

/**
 * Hook pour le debouncing
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour la pagination virtuelle
 */
export function useVirtualPagination<T>(
  items: T[],
  pageSize: number = 20
) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [visibleItems, setVisibleItems] = React.useState<T[]>([]);

  React.useEffect(() => {
    const startIndex = 0;
    const endIndex = (currentPage + 1) * pageSize;
    setVisibleItems(items.slice(startIndex, endIndex));
  }, [items, currentPage, pageSize]);

  const loadMore = React.useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const hasMore = (currentPage + 1) * pageSize < items.length;

  return {
    visibleItems,
    loadMore,
    hasMore,
    reset: () => setCurrentPage(0)
  };
}

// Import React
import React from 'react';