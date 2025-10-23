'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  stagger?: number;
}

interface ScrollAnimation {
  trigger: string;
  start: string;
  end: string;
  animation: AnimationConfig;
}

interface UseAnimationSystemReturn {
  isVisible: boolean;
  animateOnScroll: (element: HTMLElement) => void;
  triggerHover: (element: HTMLElement) => void;
  createParticles: (container: HTMLElement) => void;
}

export const useAnimationSystem = (): UseAnimationSystemReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<HTMLElement>>(new Set());

  // Throttle function for performance
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  // Initialize Intersection Observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-10% 0px -10% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Add reveal animation class
          element.classList.add('animate-scale-in');
          
          // Handle staggered animations for child elements
          const children = element.querySelectorAll('[data-stagger]');
          children.forEach((child, index) => {
            const htmlChild = child as HTMLElement;
            htmlChild.style.animationDelay = `${index * 0.1}s`;
            htmlChild.classList.add('animate-slide-in-left');
          });
          
          // Remove from observer after animation
          setTimeout(() => {
            observerRef.current?.unobserve(element);
          }, 1000);
        }
      });
    }, options);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Animate element on scroll
  const animateOnScroll = useCallback((element: HTMLElement) => {
    if (!element || elementsRef.current.has(element)) return;
    
    elementsRef.current.add(element);
    observerRef.current?.observe(element);
  }, []);

  // Trigger hover animation
  const triggerHover = useCallback((element: HTMLElement) => {
    if (!element) return;
    
    element.classList.add('hover-glow', 'hover-scale');
    
    // Add ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'absolute inset-0 rounded-full bg-white opacity-20 scale-0 animate-ping';
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }, []);

  // Create floating particles
  const createParticles = useCallback((container: HTMLElement) => {
    if (!container) return;
    
    const particleCount = Math.min(20, Math.max(5, Math.floor(container.offsetWidth / 100)));
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle animate-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 15}s`;
      particle.style.animationDuration = `${15 + Math.random() * 10}s`;
      
      // Random particle size and opacity
      const size = 2 + Math.random() * 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.opacity = `${0.3 + Math.random() * 0.4}`;
      
      container.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        particle.remove();
      }, (15 + Math.random() * 10) * 1000);
    }
  }, []);

  return {
    isVisible,
    animateOnScroll,
    triggerHover,
    createParticles
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return { fps };
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};