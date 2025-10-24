'use client';

import { useState, useEffect, useCallback } from 'react';

interface SmoothCarouselOptions {
  autoPlayInterval?: number;
  transitionDuration?: number;
  easing?: string;
  enableParallax?: boolean;
}

export const useSmoothCarousel = (
  totalImages: number,
  options: SmoothCarouselOptions = {}
) => {
  const {
    autoPlayInterval = 4000,
    transitionDuration = 0.8,
    easing = "easeInOut",
    enableParallax = true
  } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Transitions fluides avec easing personnalisé
  const smoothTransition = useCallback((newIndex: number, newDirection: 'next' | 'prev') => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setDirection(newDirection);
    
    // Délai pour permettre une transition fluide
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration * 1000);
    }, 50);
  }, [isTransitioning, transitionDuration]);

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % totalImages;
    smoothTransition(nextIndex, 'next');
  }, [currentIndex, totalImages, smoothTransition]);

  const goToPrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + totalImages) % totalImages;
    smoothTransition(prevIndex, 'prev');
  }, [currentIndex, totalImages, smoothTransition]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex) return;
    const newDirection = index > currentIndex ? 'next' : 'prev';
    smoothTransition(index, newDirection);
  }, [currentIndex, smoothTransition]);

  // Variants d'animation améliorées
  const getSlideVariants = () => ({
    enter: (direction: 'next' | 'prev') => ({
      x: direction === 'next' ? 200 : -200,
      opacity: 0,
      scale: 0.98,
      rotateY: direction === 'next' ? 8 : -8,
      filter: "blur(2px)"
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: "blur(0px)",
      zIndex: 1
    },
    exit: (direction: 'next' | 'prev') => ({
      x: direction === 'next' ? -200 : 200,
      opacity: 0,
      scale: 0.98,
      rotateY: direction === 'next' ? -8 : 8,
      filter: "blur(2px)",
      zIndex: 0
    })
  });

  const getTransitionConfig = () => ({
    x: {
      type: "spring" as const,
      stiffness: 180,
      damping: 22,
      mass: 0.9
    },
    opacity: {
      duration: transitionDuration * 0.7,
      ease: easing
    },
    scale: {
      duration: transitionDuration * 0.8,
      ease: "easeOut"
    },
    rotateY: {
      duration: transitionDuration * 0.9,
      ease: easing
    },
    filter: {
      duration: transitionDuration * 0.6,
      ease: easing
    }
  });

  // Ken Burns effect amélioré
  const getKenBurnsVariants = () => ({
    initial: {
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0
    },
    animate: {
      scale: enableParallax ? 1.06 : 1,
      x: enableParallax ? [-8, 8, -4, 0] : 0,
      y: enableParallax ? [-4, 4, -2, 0] : 0,
      rotate: enableParallax ? [-0.5, 0.5, -0.2, 0] : 0,
      transition: {
        duration: autoPlayInterval / 1000,
        ease: "easeInOut",
        x: {
          duration: autoPlayInterval / 1000,
          ease: "easeInOut",
          times: [0, 0.3, 0.7, 1]
        },
        y: {
          duration: autoPlayInterval / 1000,
          ease: "easeInOut",
          times: [0, 0.4, 0.8, 1]
        },
        rotate: {
          duration: autoPlayInterval / 1000,
          ease: "easeInOut",
          times: [0, 0.3, 0.7, 1]
        }
      }
    }
  });

  return {
    currentIndex,
    isPlaying,
    setIsPlaying,
    direction,
    isTransitioning,
    goToNext,
    goToPrev,
    goToSlide,
    getSlideVariants,
    getTransitionConfig,
    getKenBurnsVariants
  };
};