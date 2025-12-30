'use client';

import { memo, useState, useCallback } from 'react';
import { OptimizedImage, BLUR_DATA_URLS } from './OptimizedImage';
import { useIntersectionObserver } from '@/hooks/usePerformanceOptimization';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedLogoProps {
  variant?: 'header' | 'sidebar' | 'footer' | 'full';
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}

const LOGO_CONFIGS = {
  header: {
    width: 80,
    height: 24,
    quality: 90,
    priority: true,
    sizes: '80px'
  },
  sidebar: {
    width: 120,
    height: 36,
    quality: 85,
    priority: false,
    sizes: '120px'
  },
  footer: {
    width: 100,
    height: 30,
    quality: 80,
    priority: false,
    sizes: '100px'
  },
  full: {
    width: 200,
    height: 60,
    quality: 95,
    priority: false,
    sizes: '(max-width: 768px) 150px, 200px'
  }
};

const OptimizedLogoComponent = ({ 
  variant = 'header', 
  className, 
  priority,
  onClick 
}: OptimizedLogoProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  
  const config = LOGO_CONFIGS[variant];
  const { isIntersecting, hasIntersected } = useIntersectionObserver(logoRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  const shouldLoad = priority || hasIntersected || isIntersecting;

  if (hasError) {
    return (
      <div 
        ref={logoRef}
        className={cn(
          'flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded',
          className
        )}
        style={{ width: config.width, height: config.height }}
        onClick={onClick}
      >
        <span className="text-xs">LOFT</span>
      </div>
    );
  }

  return (
    <div 
      ref={logoRef}
      className={cn('relative overflow-hidden', className)}
      onClick={onClick}
      style={{ width: config.width, height: config.height }}
    >
      {shouldLoad ? (
        <OptimizedImage
          src="/logo.png"
          alt="Loft Algérie"
          width={config.width}
          height={config.height}
          priority={priority || config.priority}
          quality={config.quality}
          sizes={config.sizes}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.small}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-all duration-300 hover:scale-105',
            onClick && 'cursor-pointer'
          )}
        />
      ) : (
        // Placeholder while not in view
        <div 
          className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center"
          style={{ width: config.width, height: config.height }}
        >
          <div className="w-8 h-2 bg-gray-300 rounded" />
        </div>
      )}
      
      {/* Loading indicator */}
      {shouldLoad && !isLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const OptimizedLogo = memo(OptimizedLogoComponent);

// Preload logo for critical paths
export const preloadLogo = () => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = '/logo.png';
    document.head.appendChild(link);
  }
};

// Logo variants for different use cases
export const HeaderLogo = memo((props: Omit<OptimizedLogoProps, 'variant'>) => (
  <OptimizedLogo variant="header" priority {...props} />
));

export const SidebarLogo = memo((props: Omit<OptimizedLogoProps, 'variant'>) => (
  <OptimizedLogo variant="sidebar" {...props} />
));

export const FooterLogo = memo((props: Omit<OptimizedLogoProps, 'variant'>) => (
  <OptimizedLogo variant="footer" {...props} />
));

export const FullLogo = memo((props: Omit<OptimizedLogoProps, 'variant'>) => (
  <OptimizedLogo variant="full" {...props} />
));