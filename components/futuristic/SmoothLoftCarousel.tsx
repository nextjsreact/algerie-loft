'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import { useLoftImages } from '@/hooks/useLoftImages';
import { useSmoothCarousel } from '@/hooks/useSmoothCarousel';
import { RobustImage } from './RobustImage';

interface LoftImage {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

interface SmoothLoftCarouselProps {
  images?: LoftImage[];
  autoPlayInterval?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
}

export default function SmoothLoftCarousel({
  images: propImages,
  autoPlayInterval = 5000,
  showNavigation = true,
  showDots = true,
  className = ''
}: SmoothLoftCarouselProps) {
  const { images: loftImages, loading: imagesLoading } = useLoftImages();
  const images = propImages || loftImages;
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const {
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
  } = useSmoothCarousel(images.length, {
    autoPlayInterval,
    transitionDuration: 0.8,
    easing: "easeInOut",
    enableParallax: !prefersReducedMotion
  });

  // Auto-play avec transitions fluides
  useEffect(() => {
    if (isPlaying && !isHovered && !isTransitioning && images.length > 1) {
      intervalRef.current = setInterval(() => {
        goToNext();
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
  }, [isPlaying, isHovered, isTransitioning, goToNext, autoPlayInterval, images.length]);

  // Touch/Swipe handling amélioré
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    // Effet de résistance pour un swipe plus naturel
    const resistance = 0.3;
    const maxOffset = 80;
    const offset = Math.max(-maxOffset, Math.min(maxOffset, -diff * resistance));
    
    setSwipeOffset(offset);
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 25;
    const isRightSwipe = distance < -25;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }

    // Reset
    setSwipeOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (imagesLoading) {
    return (
      <div className={`relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-xl glass flex items-center justify-center ${className}`}>
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-500 dark:text-gray-400">Chargement des images...</p>
        </motion.div>
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

  const slideVariants = getSlideVariants();
  const transitionConfig = getTransitionConfig();
  const kenBurnsVariants = getKenBurnsVariants();

  return (
    <motion.div 
      className={`relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden glass ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={{ x: swipeOffset }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 40
      }}
    >
      {/* Images avec transitions fluides */}
      <div className="relative w-full h-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transitionConfig}
            className="absolute inset-0"
          >
            <motion.div
              variants={kenBurnsVariants}
              initial="initial"
              animate="animate"
              className="w-full h-full"
            >
              <RobustImage
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                title={images[currentIndex].title}
                fill
                priority={currentIndex === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="w-full h-full"
              />
            </motion.div>
            
            {/* Overlay dégradé */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            />
            
            {/* Informations de l'image */}
            {(images[currentIndex].title || images[currentIndex].description) && (
              <motion.div
                key={`text-${currentIndex}`}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  delay: 0.5,
                  duration: 0.7,
                  ease: "easeOut"
                }}
                className="absolute bottom-8 left-8 right-8 text-white"
              >
                <motion.div 
                  className="backdrop-blur-md bg-black/30 rounded-2xl p-6 border border-white/20 shadow-2xl"
                  whileHover={{ 
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    scale: prefersReducedMotion ? 1 : 1.02
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {images[currentIndex].title && (
                    <motion.h3 
                      className="text-2xl md:text-3xl font-bold mb-3 text-shadow-lg"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7, duration: 0.6 }}
                    >
                      {images[currentIndex].title}
                    </motion.h3>
                  )}
                  {images[currentIndex].description && (
                    <motion.p 
                      className="text-base md:text-lg opacity-95 text-shadow"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9, duration: 0.6 }}
                    >
                      {images[currentIndex].description}
                    </motion.p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Contrôles de navigation */}
      {showNavigation && images.length > 1 && (
        <>
          <motion.button
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-md bg-white/20 text-white hover:bg-white/30 transition-all duration-500 z-20 border border-white/30 shadow-xl"
            onClick={goToPrev}
            disabled={isTransitioning}
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.1,
              backgroundColor: "rgba(255, 255, 255, 0.35)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)"
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
            <ChevronLeft size={28} />
          </motion.button>

          <motion.button
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-md bg-white/20 text-white hover:bg-white/30 transition-all duration-500 z-20 border border-white/30 shadow-xl"
            onClick={goToNext}
            disabled={isTransitioning}
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.1,
              backgroundColor: "rgba(255, 255, 255, 0.35)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)"
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
            <ChevronRight size={28} />
          </motion.button>
        </>
      )}

      {/* Bouton Play/Pause */}
      {images.length > 1 && (
        <motion.button
          className="absolute top-6 right-6 p-3 rounded-full backdrop-blur-md bg-white/20 text-white hover:bg-white/30 transition-all duration-500 z-20 border border-white/30 shadow-xl"
          onClick={() => setIsPlaying(!isPlaying)}
          whileHover={{ 
            scale: prefersReducedMotion ? 1 : 1.1,
            backgroundColor: "rgba(255, 255, 255, 0.35)",
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
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </motion.div>
        </motion.button>
      )}

      {/* Indicateurs de navigation */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
          {images.map((_, index) => (
            <motion.button
              key={index}
              className="relative rounded-full backdrop-blur-sm border border-white/30"
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              whileHover={{ 
                scale: prefersReducedMotion ? 1 : 1.2,
                backgroundColor: "rgba(255, 255, 255, 0.4)"
              }}
              whileTap={{ 
                scale: prefersReducedMotion ? 1 : 0.9,
                transition: { duration: 0.1 }
              }}
              animate={{
                width: index === currentIndex ? 40 : 16,
                height: 16,
                backgroundColor: index === currentIndex ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)"
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.5
              }}
            >
              {index === currentIndex && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-60"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.6 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Barre de progression améliorée */}
      {isPlaying && !isHovered && images.length > 1 && !isTransitioning && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 shadow-lg"
            key={`progress-${currentIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: autoPlayInterval / 1000, 
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{
              x: ['-32px', '100%']
            }}
            transition={{
              duration: 2.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.5
            }}
          />
        </div>
      )}
    </motion.div>
  );
}