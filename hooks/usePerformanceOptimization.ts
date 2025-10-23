'use client';



// Hook for debouncing values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling functions
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastRan = useRef<number>(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        func(...args);
        lastRan.current = Date.now();
      }
    }) as T,
    [func, delay]
  );
}

// Hook for memoizing expensive calculations
export function useExpensiveCalculation<T>(
  calculation: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(() => {
    const start = performance.now();
    const result = calculation();
    const end = performance.now();
    
    if (end - start > 16) { // More than one frame (16ms)
      console.warn(`Expensive calculation took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }, dependencies);
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, hasIntersected, options]);

  return { isIntersecting, hasIntersected };
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - lastRenderTime.current;
    totalRenderTime.current += renderTime;

    if (renderCount.current % 10 === 0) {
      const avgRenderTime = totalRenderTime.current / renderCount.current;
      console.log(`${componentName} - Renders: ${renderCount.current}, Avg: ${avgRenderTime.toFixed(2)}ms`);
    }
  });

  useEffect(() => {
    lastRenderTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    avgRenderTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0
  };
}

// Hook for optimizing list rendering
export function useVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, visibleStart - overscan),
      end: Math.min(items.length - 1, visibleEnd + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  };
}

// Hook for preloading resources
export function usePreloader(resources: string[]) {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());
  const [failedResources, setFailedResources] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadPromises = resources.map(resource => {
      return new Promise<string>((resolve, reject) => {
        if (resource.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          // Preload image
          const img = new Image();
          img.onload = () => resolve(resource);
          img.onerror = () => reject(resource);
          img.src = resource;
        } else if (resource.match(/\.(js|css)$/i)) {
          // Preload script or stylesheet
          const link = document.createElement('link');
          link.rel = resource.endsWith('.css') ? 'stylesheet' : 'preload';
          if (resource.endsWith('.js')) {
            link.as = 'script';
          }
          link.href = resource;
          link.onload = () => resolve(resource);
          link.onerror = () => reject(resource);
          document.head.appendChild(link);
        } else {
          // Generic fetch preload
          fetch(resource)
            .then(() => resolve(resource))
            .catch(() => reject(resource));
        }
      });
    });

    Promise.allSettled(preloadPromises).then(results => {
      const loaded = new Set<string>();
      const failed = new Set<string>();

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          loaded.add(result.value);
        } else {
          failed.add(resources[index]);
        }
      });

      setLoadedResources(loaded);
      setFailedResources(failed);
    });
  }, [resources]);

  return {
    loadedResources,
    failedResources,
    isLoading: loadedResources.size + failedResources.size < resources.length,
    progress: (loadedResources.size + failedResources.size) / resources.length
  };
}

// Hook for optimizing re-renders with shallow comparison
export function useShallowMemo<T extends Record<string, any>>(obj: T): T {
  const ref = useRef<T>(obj);

  return useMemo(() => {
    // Shallow comparison
    const keys = Object.keys(obj);
    const prevKeys = Object.keys(ref.current);

    if (keys.length !== prevKeys.length) {
      ref.current = obj;
      return obj;
    }

    for (const key of keys) {
      if (obj[key] !== ref.current[key]) {
        ref.current = obj;
        return obj;
      }
    }

    return ref.current;
  }, [obj]);
}

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';