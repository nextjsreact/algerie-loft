'use client';

import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useLazyLoading({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
}: UseLazyLoadingOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Skip if already triggered and triggerOnce is true
    if (triggerOnce && hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && triggerOnce) {
          setHasTriggered(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    elementRef,
    isIntersecting: triggerOnce ? (hasTriggered || isIntersecting) : isIntersecting,
    hasTriggered,
  };
}

// Hook for lazy loading images
export function useLazyImage(src: string, options?: UseLazyLoadingOptions) {
  const { elementRef, isIntersecting } = useLazyLoading(options);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isIntersecting && src && !imageSrc) {
      setImageSrc(src);
    }
  }, [isIntersecting, src, imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc]);

  return {
    elementRef,
    imageSrc,
    isLoaded,
    hasError,
    isIntersecting,
  };
}

// Hook for lazy loading components
export function useLazyComponent(options?: UseLazyLoadingOptions) {
  const { elementRef, isIntersecting } = useLazyLoading(options);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isIntersecting) {
      setShouldRender(true);
    }
  }, [isIntersecting]);

  return {
    elementRef,
    shouldRender,
    isIntersecting,
  };
}

// Utility for preloading critical resources
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;

  document.head.appendChild(link);
}

// Utility for prefetching resources
export function prefetchResource(href: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;

  document.head.appendChild(link);
}

// Hook for managing resource preloading
export function useResourcePreloading() {
  const preloadImage = (src: string) => {
    preloadResource(src, 'image');
  };

  const preloadFont = (src: string) => {
    preloadResource(src, 'font', 'font/woff2');
  };

  const prefetchPage = (href: string) => {
    prefetchResource(href);
  };

  return {
    preloadImage,
    preloadFont,
    prefetchPage,
  };
}