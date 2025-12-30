'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from './useAnimationSystem';

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  supportsHover: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  screenSize: 'sm' | 'md' | 'lg' | 'xl';
}

interface AnimationConfig {
  duration: number;
  easing: string;
  stagger: number;
  scale: number;
  blur: boolean;
  particles: boolean;
}

export const useResponsiveAnimations = () => {
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
    supportsHover: true,
    performanceLevel: 'high',
    screenSize: 'lg'
  });

  const prefersReducedMotion = useReducedMotion();

  // Detect device capabilities
  useEffect(() => {
    const detectCapabilities = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Screen size detection
      let screenSize: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
      if (width < 640) screenSize = 'sm';
      else if (width < 1024) screenSize = 'md';
      else if (width < 1280) screenSize = 'lg';
      else screenSize = 'xl';

      // Device type detection
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Touch and hover detection
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const supportsHover = window.matchMedia('(hover: hover)').matches;

      // Performance level estimation
      let performanceLevel: 'low' | 'medium' | 'high' = 'high';
      
      // Check for performance indicators
      const connection = (navigator as any).connection;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const deviceMemory = (navigator as any).deviceMemory || 4;

      if (isMobile || (connection && connection.effectiveType === '2g') || hardwareConcurrency < 4 || deviceMemory < 4) {
        performanceLevel = 'low';
      } else if (isTablet || (connection && connection.effectiveType === '3g') || hardwareConcurrency < 8) {
        performanceLevel = 'medium';
      }

      setDeviceCapabilities({
        isMobile,
        isTablet,
        isDesktop,
        hasTouch,
        supportsHover,
        performanceLevel,
        screenSize
      });
    };

    detectCapabilities();
    
    const handleResize = () => {
      detectCapabilities();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get optimized animation config based on device capabilities
  const getAnimationConfig = useCallback((baseConfig: Partial<AnimationConfig> = {}): AnimationConfig => {
    if (prefersReducedMotion) {
      return {
        duration: 0,
        easing: 'linear',
        stagger: 0,
        scale: 1,
        blur: false,
        particles: false
      };
    }

    const { performanceLevel, isMobile, screenSize } = deviceCapabilities;

    // Base configuration
    let config: AnimationConfig = {
      duration: 0.6,
      easing: 'easeOut',
      stagger: 0.1,
      scale: 1.05,
      blur: true,
      particles: true,
      ...baseConfig
    };

    // Adjust based on performance level
    switch (performanceLevel) {
      case 'low':
        config = {
          ...config,
          duration: Math.max(0.3, config.duration * 0.5),
          stagger: Math.max(0.05, config.stagger * 0.5),
          scale: Math.min(1.02, config.scale),
          blur: false,
          particles: false
        };
        break;
      
      case 'medium':
        config = {
          ...config,
          duration: Math.max(0.4, config.duration * 0.75),
          stagger: Math.max(0.075, config.stagger * 0.75),
          scale: Math.min(1.03, config.scale),
          blur: screenSize !== 'sm',
          particles: !isMobile
        };
        break;
      
      case 'high':
        // Use full configuration
        break;
    }

    // Mobile-specific adjustments
    if (isMobile) {
      config.duration = Math.max(0.3, config.duration * 0.8);
      config.stagger = Math.max(0.05, config.stagger * 0.8);
      config.particles = false;
    }

    return config;
  }, [deviceCapabilities, prefersReducedMotion]);

  // Get Framer Motion variants optimized for device
  const getMotionVariants = useCallback((type: 'fade' | 'slide' | 'scale' | 'stagger') => {
    const config = getAnimationConfig();

    const variants = {
      fade: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: config.duration,
            ease: config.easing
          }
        }
      },
      slide: {
        hidden: { opacity: 0, y: 50 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: config.duration,
            ease: config.easing
          }
        }
      },
      scale: {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            duration: config.duration,
            ease: config.easing
          }
        }
      },
      stagger: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: config.duration,
            staggerChildren: config.stagger,
            ease: config.easing
          }
        }
      }
    };

    return variants[type];
  }, [getAnimationConfig]);

  // Get hover animation config
  const getHoverConfig = useCallback(() => {
    const config = getAnimationConfig();
    
    if (!deviceCapabilities.supportsHover || prefersReducedMotion) {
      return {};
    }

    return {
      scale: config.scale,
      y: deviceCapabilities.isMobile ? 0 : -2,
      transition: {
        duration: config.duration * 0.5,
        ease: config.easing
      }
    };
  }, [deviceCapabilities, getAnimationConfig, prefersReducedMotion]);

  // Check if feature should be enabled
  const shouldEnableFeature = useCallback((feature: 'particles' | 'blur' | 'glow' | 'parallax') => {
    if (prefersReducedMotion) return false;
    
    const config = getAnimationConfig();
    const { performanceLevel, isMobile } = deviceCapabilities;

    switch (feature) {
      case 'particles':
        return config.particles && performanceLevel === 'high' && !isMobile;
      
      case 'blur':
        return config.blur && performanceLevel !== 'low';
      
      case 'glow':
        return performanceLevel !== 'low' && deviceCapabilities.supportsHover;
      
      case 'parallax':
        return performanceLevel === 'high' && !isMobile;
      
      default:
        return true;
    }
  }, [deviceCapabilities, getAnimationConfig, prefersReducedMotion]);

  // Get CSS classes for animations
  const getAnimationClasses = useCallback((baseClasses: string = '') => {
    const config = getAnimationConfig();
    let classes = baseClasses;

    // Add performance-based classes
    if (shouldEnableFeature('blur')) {
      classes += ' backdrop-blur-xl';
    } else {
      classes += ' backdrop-blur-sm';
    }

    if (shouldEnableFeature('glow') && deviceCapabilities.supportsHover) {
      classes += ' hover-glow';
    }

    return classes;
  }, [getAnimationConfig, shouldEnableFeature, deviceCapabilities]);

  return {
    deviceCapabilities,
    getAnimationConfig,
    getMotionVariants,
    getHoverConfig,
    shouldEnableFeature,
    getAnimationClasses,
    isHighPerformance: deviceCapabilities.performanceLevel === 'high',
    isMobileDevice: deviceCapabilities.isMobile,
    supportsAdvancedAnimations: deviceCapabilities.performanceLevel !== 'low' && !prefersReducedMotion
  };
};

// Performance monitoring hook
export const useAnimationPerformance = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    frameDrops: 0,
    averageFrameTime: 16.67
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let frameDrops = 0;
    let frameTimes: number[] = [];

    const measurePerformance = (currentTime: number) => {
      frameCount++;
      const frameTime = currentTime - lastTime;
      frameTimes.push(frameTime);

      // Keep only last 60 frames
      if (frameTimes.length > 60) {
        frameTimes.shift();
      }

      // Count frame drops (> 20ms = < 50fps)
      if (frameTime > 20) {
        frameDrops++;
      }

      // Update metrics every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round(1000 / (frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length));
        const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

        setMetrics({
          fps: Math.min(60, fps),
          frameDrops,
          averageFrameTime
        });

        frameCount = 0;
        frameDrops = 0;
        frameTimes = [];
        lastTime = currentTime;
      }

      requestAnimationFrame(measurePerformance);
    };

    const animationId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return {
    ...metrics,
    isPerformanceGood: metrics.fps >= 50 && metrics.frameDrops < 5,
    shouldReduceAnimations: metrics.fps < 30 || metrics.frameDrops > 10
  };
};