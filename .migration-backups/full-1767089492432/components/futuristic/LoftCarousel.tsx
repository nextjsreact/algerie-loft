'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import { useLoftImages } from '@/hooks/useLoftImages';
import { RobustImage } from './RobustImage';

interface LoftImage {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

interface LoftCarouselProps {
  images: LoftImage[];
  autoPlayInterval?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
}

export default function LoftCarousel({
  images: propImages,
  autoPlayInterval = 4000,
  showNavigation = true,
  showDots = true,
  className = ''
}: LoftCarouselProps) {
  const { images: loftImages, loading: imagesLoading } = useLoftImages();
  const images = propImages || loftImages;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        handleNext();
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isHovered, currentIndex, autoPlayInterval, images.length]);

  const handleNext = useCallback(() => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleDotClick = useCallback((index: number) => {
    setDirection(index > currentIndex ? 'next' : 'prev');
    setCurrentIndex(index);
  }, [currentIndex]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Touch handlers for mobile swipe with improved sensitivity
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipping, setIsSwipping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwipping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    touchEndX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    
    // Limite le swipe pour éviter les mouvements trop brusques
    const maxOffset = 100;
    const offset = Math.max(-maxOffset, Math.min(maxOffset, -diff * 0.5));
    setSwipeOffset(offset);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current && touchEndX.current) {
      const diff = touchStartX.current - touchEndX.current;
      const threshold = 30; // Seuil réduit pour plus de sensibilité

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    
    // Reset des valeurs
    touchStartX.current = null;
    touchEndX.current = null;
    setSwipeOffset(0);
    setIsSwipping(false);
  };

  const slideVariants = {
    enter: (direction: 'next' | 'prev') => ({
      x: direction === 'next' ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      rotateY: direction === 'next' ? 15 : -15
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0
    },
    exit: (direction: 'next' | 'prev') => ({
      zIndex: 0,
      x: direction === 'next' ? -300 : 300,
      opacity: 0,
      scale: 0.95,
      rotateY: direction === 'next' ? -15 : 15
    })
  };

  const kenBurnsVariants = {
    initial: { 
      scale: 1,
      x: 0,
      y: 0
    },
    animate: {
      scale: prefersReducedMotion ? 1 : 1.08,
      x: prefersReducedMotion ? 0 : [-10, 10, -5, 0],
      y: prefersReducedMotion ? 0 : [-5, 5, -2, 0],
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
        }
      }
    }
  };

  if (imagesLoading) {
    return (
      <div className={`relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-xl glass flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Chargement des images...</p>
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className={`relative w-full h-96 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">Aucune image disponible</p>
      </div>
    );
  }

  return (
    <motion.div 
      className={`relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden glass ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={{
        x: swipeOffset
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
    >
      {/* Main Image Display */}
      <div className="relative w-full h-full">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { 
                type: "spring", 
                stiffness: 200, 
                damping: 25,
                mass: 0.8
              },
              opacity: { 
                duration: 0.6,
                ease: "easeInOut"
              },
              scale: { 
                duration: 0.6,
                ease: "easeOut"
              },
              rotateY: {
                duration: 0.6,
                ease: "easeInOut"
              }
            }}
            className="absolute inset-0"
          >
            <motion.div
              variants={kenBurnsVariants}
              initial="initial"
              animate="animate"
              className="w-full h-full"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)'
              }}
            >
              <RobustImage
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                title={images[currentIndex].title}
                fill
                priority={currentIndex === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            {/* Image Overlay with Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {(images[currentIndex].title || images[currentIndex].description) && (
              <motion.div
                key={`text-${currentIndex}`}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ 
                  delay: 0.4,
                  duration: 0.6,
                  ease: "easeOut"
                }}
                className="absolute bottom-6 left-6 right-6 text-white"
              >
                <div className="backdrop-blur-sm bg-black/20 rounded-lg p-4 border border-white/10">
                  {images[currentIndex].title && (
                    <motion.h3 
                      className="text-xl md:text-2xl font-bold mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      {images[currentIndex].title}
                    </motion.h3>
                  )}
                  {images[currentIndex].description && (
                    <motion.p 
                      className="text-sm md:text-base opacity-90"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      {images[currentIndex].description}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {showNavigation && images.length > 1 && (
        <>
          <motion.button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass text-white hover:bg-white/30 transition-all duration-500 z-10 backdrop-blur-md border border-white/20"
            onClick={handlePrev}
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.15,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
            whileTap={{ 
              scale: prefersReducedMotion ? 1 : 0.95,
              transition: { duration: 0.1 }
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
          >
            <ChevronLeft size={24} />
          </motion.button>

          <motion.button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass text-white hover:bg-white/30 transition-all duration-500 z-10 backdrop-blur-md border border-white/20"
            onClick={handleNext}
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.15,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
            whileTap={{ 
              scale: prefersReducedMotion ? 1 : 0.95,
              transition: { duration: 0.1 }
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
          >
            <ChevronRight size={24} />
          </motion.button>
        </>
      )}

      {/* Play/Pause Button */}
      {images.length > 1 && (
        <motion.button
          className="absolute top-4 right-4 p-2 rounded-full glass text-white hover:bg-white/30 transition-all duration-500 z-10 backdrop-blur-md border border-white/20"
          onClick={togglePlayPause}
          whileHover={{ 
            scale: prefersReducedMotion ? 1 : 1.1,
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            rotate: prefersReducedMotion ? 0 : 5
          }}
          whileTap={{ 
            scale: prefersReducedMotion ? 1 : 0.9,
            transition: { duration: 0.1 }
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        >
          <motion.div
            animate={{ rotate: isPlaying ? 0 : 90 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </motion.div>
        </motion.button>
      )}

      {/* Dots Navigation */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {images.map((_, index) => (
            <motion.button
              key={index}
              className={`relative rounded-full transition-all duration-500 ${
                index === currentIndex 
                  ? 'w-8 h-3 bg-white' 
                  : 'w-3 h-3 bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => handleDotClick(index)}
              whileHover={{ 
                scale: prefersReducedMotion ? 1 : 1.2,
                backgroundColor: index === currentIndex ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.8)"
              }}
              whileTap={{ 
                scale: prefersReducedMotion ? 1 : 0.9,
                transition: { duration: 0.1 }
              }}
              animate={{
                width: index === currentIndex ? 32 : 12,
                backgroundColor: index === currentIndex ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.5)"
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.4
              }}
            >
              {index === currentIndex && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {isPlaying && !isHovered && images.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
            key={currentIndex}
            initial={{ width: '0%', x: '-100%' }}
            animate={{ 
              width: '100%', 
              x: '0%'
            }}
            transition={{ 
              duration: autoPlayInterval / 1000, 
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        </div>
      )}
    </motion.div>
  );
}