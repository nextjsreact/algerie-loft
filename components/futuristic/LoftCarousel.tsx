'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import { useLoftImages } from '@/hooks/useLoftImages';
import { CarouselImage } from './OptimizedImage';

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

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current && touchEndX.current) {
      const diff = touchStartX.current - touchEndX.current;
      const threshold = 50;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const slideVariants = {
    enter: (direction: 'next' | 'prev') => ({
      x: direction === 'next' ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: 'next' | 'prev') => ({
      zIndex: 0,
      x: direction === 'next' ? -1000 : 1000,
      opacity: 0,
      scale: 0.8
    })
  };

  const kenBurnsVariants = {
    initial: { scale: 1 },
    animate: {
      scale: prefersReducedMotion ? 1 : 1.1,
      transition: {
        duration: autoPlayInterval / 1000,
        ease: "easeInOut"
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
    <div 
      className={`relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden glass ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.4 }
            }}
            className="absolute inset-0"
          >
            <motion.div
              variants={kenBurnsVariants}
              initial="initial"
              animate="animate"
              className="w-full h-full"
            >
              <CarouselImage
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                fill
                priority={currentIndex === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            </motion.div>
            
            {/* Image Overlay with Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {(images[currentIndex].title || images[currentIndex].description) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-6 left-6 right-6 text-white"
              >
                {images[currentIndex].title && (
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    {images[currentIndex].title}
                  </h3>
                )}
                {images[currentIndex].description && (
                  <p className="text-sm md:text-base opacity-90">
                    {images[currentIndex].description}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {showNavigation && images.length > 1 && (
        <>
          <motion.button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass text-white hover:bg-white/20 transition-all duration-300 z-10"
            onClick={handlePrev}
            whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
          >
            <ChevronLeft size={24} />
          </motion.button>

          <motion.button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass text-white hover:bg-white/20 transition-all duration-300 z-10"
            onClick={handleNext}
            whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
          >
            <ChevronRight size={24} />
          </motion.button>
        </>
      )}

      {/* Play/Pause Button */}
      {images.length > 1 && (
        <motion.button
          className="absolute top-4 right-4 p-2 rounded-full glass text-white hover:bg-white/20 transition-all duration-300 z-10"
          onClick={togglePlayPause}
          whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </motion.button>
      )}

      {/* Dots Navigation */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, index) => (
            <motion.button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => handleDotClick(index)}
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.2 }}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {isPlaying && !isHovered && images.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <motion.div
            className="h-full bg-gradient-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: autoPlayInterval / 1000, 
              ease: "linear",
              repeat: Infinity 
            }}
          />
        </div>
      )}
    </div>
  );
}