'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import { useState, useEffect } from 'react';
import { logoAssetManager, getLogoSources, DEFAULT_LOGO_CONFIG } from '@/lib/logo-asset-manager';
import LogoLoadingIndicator from '@/components/ui/LogoLoadingIndicator';
import { recordLogoLoad } from '@/lib/logo-health-monitor';

interface AnimatedLogoProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  variant?: 'header' | 'hero' | 'footer';
  showGlow?: boolean;
  fallbackSources?: string[];
  loadingTimeout?: number;
  onLoadError?: (error: Error) => void;
  lazy?: boolean; // Enable lazy loading for below-fold content
}

enum LogoLoadingStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  FALLBACK = 'fallback',
  TEXT_FALLBACK = 'text_fallback'
}

export default function AnimatedLogo({
  src = '/logo-temp.svg',
  alt = 'Loft Algérie - Votre Confort Notre Priorité',
  width = 200,
  height = 60,
  className = '',
  variant = 'header',
  showGlow = false,
  fallbackSources = ['/logo.jpg', '/logo-fallback.svg', '/placeholder-logo.svg'],
  loadingTimeout = 2000,
  onLoadError,
  lazy = false
}: AnimatedLogoProps) {
  const prefersReducedMotion = useReducedMotion();
  const [loadingStatus, setLoadingStatus] = useState<LogoLoadingStatus>(LogoLoadingStatus.LOADING);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [attemptedSources, setAttemptedSources] = useState<string[]>([]);
  const [showFallback, setShowFallback] = useState(false);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);

  // Initialize available sources on mount with immediate placeholder
  useEffect(() => {
    const initializeSources = async () => {
      try {
        // Show placeholder immediately for progressive enhancement
        setLoadingStatus(LogoLoadingStatus.LOADING);
        
        const sources = await getLogoSources(src);
        setAvailableSources(sources);
        console.log('🎯 Available logo sources:', sources);
        
        // Record the start of loading attempt
        setLoadStartTime(performance.now());
      } catch (error) {
        console.error('Failed to initialize logo sources:', error);
        setAvailableSources(fallbackSources || []);
        setLoadStartTime(performance.now());
      }
    };

    initializeSources();
  }, [src, fallbackSources]);

  // Initialize loading timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingStatus === LogoLoadingStatus.LOADING) {
        console.warn(`Logo loading timeout after ${loadingTimeout}ms for src: ${currentSrc}`);
        tryNextFallback();
      }
    }, loadingTimeout);

    return () => clearTimeout(timer);
  }, [currentSrc, loadingStatus, loadingTimeout]);

  // Function to try next fallback source
  const tryNextFallback = async () => {
    const nextIndex = attemptedSources.length;
    
    if (nextIndex < availableSources.length) {
      const nextSrc = availableSources[nextIndex];
      console.log(`🔄 Trying fallback logo: ${nextSrc}`);
      
      // Verify asset exists before trying to load it
      const exists = await logoAssetManager.verifyAssetExists(nextSrc);
      if (exists) {
        setCurrentSrc(nextSrc);
        setAttemptedSources(prev => [...prev, currentSrc]);
        setLoadingStatus(LogoLoadingStatus.FALLBACK);
      } else {
        // Skip this source and try the next one
        setAttemptedSources(prev => [...prev, nextSrc]);
        tryNextFallback();
      }
    } else {
      console.error('🚨 All logo sources failed, showing text fallback');
      setLoadingStatus(LogoLoadingStatus.TEXT_FALLBACK);
      setShowFallback(true);
    }
  };

  // Handle image load success
  const handleImageLoad = () => {
    const loadTime = performance.now() - loadStartTime;
    console.log(`✅ Logo loaded successfully: ${currentSrc} (${loadTime.toFixed(2)}ms)`);
    
    // Record successful load in health monitor
    recordLogoLoad(currentSrc, true, loadTime, variant);
    
    setLoadingStatus(LogoLoadingStatus.SUCCESS);
  };

  // Handle image load error with detailed diagnostics
  const handleImageError = (error: any) => {
    const errorDiagnostics = {
      timestamp: new Date(),
      attemptedSources: [...attemptedSources, currentSrc],
      errorType: 'not_found' as const,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      viewport: typeof window !== 'undefined' ? { 
        width: window.innerWidth, 
        height: window.innerHeight 
      } : { width: 0, height: 0 },
      networkStatus: typeof navigator !== 'undefined' && 'onLine' in navigator 
        ? (navigator.onLine ? 'online' : 'offline') 
        : 'unknown' as const,
      variant,
      dimensions: { width, height }
    };

    const errorMsg = `Failed to load logo: ${currentSrc}`;
    const loadTime = performance.now() - loadStartTime;
    
    console.error(errorMsg, errorDiagnostics);
    
    // Record failed load in health monitor
    recordLogoLoad(currentSrc, false, loadTime, variant, errorMsg);
    
    // Log to console for debugging
    console.group('🚨 Logo Loading Error');
    console.error('Source:', currentSrc);
    console.error('Load time:', `${loadTime.toFixed(2)}ms`);
    console.error('Attempted sources:', errorDiagnostics.attemptedSources);
    console.error('Network status:', errorDiagnostics.networkStatus);
    console.error('Viewport:', errorDiagnostics.viewport);
    console.error('Variant:', variant);
    console.groupEnd();
    
    if (onLoadError) {
      onLoadError(new Error(errorMsg));
    }
    
    setLoadingStatus(LogoLoadingStatus.ERROR);
    tryNextFallback();
  };

  const logoVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: variant === 'hero' ? 20 : 0
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const imageVariants = {
    loading: { 
      opacity: 0,
      scale: 0.95
    },
    loaded: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: "easeOut",
        delay: 0.1 // Small delay for smooth transition from loading
      }
    }
  };

  const loadingVariants = {
    visible: { 
      opacity: 1,
      scale: 1
    },
    hidden: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: "easeIn"
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: showGlow ? [0, 0.5, 0] : 0,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return 'drop-shadow-2xl filter brightness-110';
      case 'header':
        return 'drop-shadow-lg';
      case 'footer':
        return 'opacity-90 hover:opacity-100';
      default:
        return '';
    }
  };

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      variants={logoVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {/* Golden Glow Effect for Loft Algérie */}
      {showGlow && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-lg blur-lg opacity-0"
          variants={glowVariants}
          animate="animate"
        />
      )}

      {/* Loading State with Consistent Dimensions */}
      <motion.div
        className={`absolute inset-0 z-10 ${getVariantStyles()}`}
        variants={loadingVariants}
        initial="visible"
        animate={loadingStatus === LogoLoadingStatus.LOADING ? "visible" : "hidden"}
        style={{ 
          minWidth: width, 
          minHeight: height,
          maxWidth: width,
          maxHeight: height
        }}
      >
        <LogoLoadingIndicator
          width={width}
          height={height}
          variant={variant}
        />
      </motion.div>

      {/* Logo Image with Progressive Enhancement */}
      {(loadingStatus === LogoLoadingStatus.SUCCESS || loadingStatus === LogoLoadingStatus.FALLBACK || loadingStatus === LogoLoadingStatus.ERROR) && !showFallback && (
        <motion.div 
          className={`relative z-20 ${getVariantStyles()}`}
          variants={imageVariants}
          initial="loading"
          animate={loadingStatus === LogoLoadingStatus.SUCCESS ? "loaded" : "loading"}
          style={{ 
            minWidth: width, 
            minHeight: height,
            maxWidth: width,
            maxHeight: height
          }}
        >
          <Image
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            className="object-contain transition-all duration-300"
            priority={variant === 'header' || variant === 'hero'}
            loading={lazy ? 'lazy' : 'eager'} // Lazy loading for footer
            quality={variant === 'hero' ? 95 : 85} // Higher quality for hero
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </motion.div>
      )}

      {/* Text Fallback */}
      {(loadingStatus === LogoLoadingStatus.TEXT_FALLBACK || showFallback) && (
        <div 
          className={`relative z-10 flex items-center justify-center ${getVariantStyles()}`}
          style={{ width, height }}
        >
          <div className="text-center">
            <div className={DEFAULT_LOGO_CONFIG.textFallback.className}>
              {DEFAULT_LOGO_CONFIG.textFallback.text}
            </div>
            <div className="text-xs text-gray-400 mt-1">Votre Confort Notre Priorité</div>
          </div>
        </div>
      )}

      {/* Shine Effect on Hover */}
      {!prefersReducedMotion && variant === 'hero' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0"
          whileHover={{
            x: ['0%', '100%'],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 0.8 }}
        />
      )}
    </motion.div>
  );
}

// Variantes spécialisées pour le logo Loft Algérie
export function HeaderLogo({ src, className = '', ...props }: Omit<AnimatedLogoProps, 'variant'>) {
  return (
    <AnimatedLogo
      src={src}
      variant="header"
      width={80}
      height={24}
      className={`${className} max-h-6 -mt-6 sm:max-h-8 md:max-h-10 lg:max-h-12`} // Responsive sizing
      loadingTimeout={2000} // Faster timeout for header (above fold)
      fallbackSources={['/logo-temp.svg', '/logo-fallback.svg']} // Minimal fallbacks for speed
      {...props}
    />
  );
}

export function HeroLogo({ src, className = '', showGlow = true, ...props }: Omit<AnimatedLogoProps, 'variant'>) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <AnimatedLogo
      src={src}
      variant="hero"
      width={300}
      height={120}
      showGlow={showGlow && !prefersReducedMotion} // Respect reduced motion preference
      className={`${className} max-h-32 -mt-5 sm:max-h-40 md:max-h-48 lg:max-h-56`} // Responsive sizing
      loadingTimeout={5000} // Optimized timeout for hero (high priority)
      fallbackSources={['/logo.png', '/logo-temp.svg', '/logo-fallback.svg', '/placeholder-logo.svg']} // Full fallback chain for quality
      {...props}
    />
  );
}

export function FooterLogo({ src, className = '', ...props }: Omit<AnimatedLogoProps, 'variant'>) {
  return (
    <AnimatedLogo
      src={src}
      variant="footer"
      width={160}
      height={48}
      className={`${className} max-h-16 sm:max-h-20`} // Responsive sizing
      loadingTimeout={3000} // Faster timeout for footer (below fold)
      fallbackSources={['/logo-temp.svg', '/placeholder-logo.svg']} // Minimal fallbacks for footer
      lazy={true} // Enable lazy loading for footer (below fold)
      {...props}
    />
  );
}

// Version compacte pour barres de navigation étroites
export function CompactLogo({ src, className = '', ...props }: Omit<AnimatedLogoProps, 'variant'>) {
  return (
    <AnimatedLogo
      src={src}
      variant="header"
      width={80}
      height={24}
      className={`${className} max-h-6`}
      loadingTimeout={2000} // Very fast timeout for compact
      fallbackSources={['/logo-temp.svg']} // Single fallback for speed
      {...props}
    />
  );
}