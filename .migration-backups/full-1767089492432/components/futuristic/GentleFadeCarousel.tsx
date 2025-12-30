'use client';

import { useState, useEffect, useRef } from 'react';
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

interface GentleFadeCarouselProps {
  images?: LoftImage[];
  autoPlayInterval?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
}

export default function GentleFadeCarousel({
  images: propImages,
  autoPlayInterval = 6000, // Optimisé pour le fondu croisé
  showNavigation = true,
  showDots = true,
  className = ''
}: GentleFadeCarouselProps) {
  const { images: loftImages, loading: imagesLoading } = useLoftImages();
  const images = propImages || loftImages;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-play avec transitions très douces
  useEffect(() => {
    if (isPlaying && !isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
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
  }, [isPlaying, isHovered, autoPlayInterval, images.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  }; 
 // Variants pour fondu très doux - AUCUN mouvement, que de l'opacité
  const fadeVariants = {
    enter: {
      opacity: 0,
      scale: 1, // Pas de changement d'échelle
      x: 0,     // Pas de mouvement horizontal
      y: 0      // Pas de mouvement vertical
    },
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      zIndex: 1
    },
    exit: {
      opacity: 0,
      scale: 1,
      x: 0,
      y: 0,
      zIndex: 0
    }
  };

  // Transition ultra-douce et lente
  const gentleTransition = {
    opacity: {
      duration: 2.5,        // 2.5 secondes pour le fondu
      ease: [0.25, 0.1, 0.25, 1] // Courbe très douce
    },
    scale: {
      duration: 2.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  };

  // Ken Burns très subtil (zoom imperceptible)
  const subtleKenBurns = {
    initial: { 
      scale: 1,
      opacity: 1
    },
    animate: {
      scale: prefersReducedMotion ? 1 : 1.02, // Zoom très léger
      opacity: 1,
      transition: {
        duration: autoPlayInterval / 1000,
        ease: "easeInOut"
      }
    }
  };

  if (imagesLoading) {
    return (
      <div className={`relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-xl glass flex items-center justify-center ${className}`}>
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div 
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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
 return (
    <div 
      className={`relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden glass ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images avec fondu croisé continu - AUCUN VIDE */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            animate={{
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 1 : 0
            }}
            transition={{
              opacity: {
                duration: 1.8,  // Fondu plus rapide pour éviter le vide
                ease: [0.4, 0, 0.2, 1]  // Courbe optimisée
              }
            }}
          >
            <motion.div
              className="w-full h-full"
              animate={{
                scale: index === currentIndex && !prefersReducedMotion ? 1.02 : 1
              }}
              transition={{
                scale: {
                  duration: autoPlayInterval / 1000,
                  ease: "easeInOut"
                }
              }}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)'
              }}
            >
              <RobustImage
                src={image.src}
                alt={image.alt}
                title={image.title}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            {/* Overlay dégradé très subtil */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
              animate={{
                opacity: index === currentIndex ? 1 : 0
              }}
              transition={{ 
                opacity: {
                  duration: 1.8,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
            />
            
            {/* Informations avec apparition très douce */}
            {(image.title || image.description) && (
              <motion.div
                className="absolute bottom-8 left-8 right-8 text-white"
                animate={{
                  opacity: index === currentIndex ? 1 : 0
                }}
                transition={{ 
                  opacity: {
                    duration: 1.8,
                    delay: index === currentIndex ? 0.5 : 0,
                    ease: "easeOut"
                  }
                }}
              >
                <div className="backdrop-blur-sm bg-black/20 rounded-2xl p-6 border border-white/10">
                  {image.title && (
                    <h3 className="text-2xl md:text-3xl font-bold mb-3 text-shadow-lg">
                      {image.title}
                    </h3>
                  )}
                  {image.description && (
                    <p className="text-base md:text-lg opacity-95 text-shadow">
                      {image.description}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Contrôles très discrets */}
      {showNavigation && images.length > 1 && (
        <>
          <motion.button
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-md bg-black/20 text-white/80 hover:text-white hover:bg-black/30 transition-all duration-1000 z-20 border border-white/20"
            onClick={goToPrev}
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.05,
              backgroundColor: "rgba(0, 0, 0, 0.4)"
            }}
            whileTap={{ 
              scale: prefersReducedMotion ? 1 : 0.98
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut"
            }}
          >
            <ChevronLeft size={24} />
          </motion.button>

          <motion.button
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-md bg-black/20 text-white/80 hover:text-white hover:bg-black/30 transition-all duration-1000 z-20 border border-white/20"
            onClick={goToNext}
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.05,
              backgroundColor: "rgba(0, 0, 0, 0.4)"
            }}
            whileTap={{ 
              scale: prefersReducedMotion ? 1 : 0.98
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut"
            }}
          >
            <ChevronRight size={24} />
          </motion.button>
        </>
      )}

      {/* Bouton Play/Pause très discret */}
      {images.length > 1 && (
        <motion.button
          className="absolute top-6 right-6 p-3 rounded-full backdrop-blur-md bg-black/20 text-white/80 hover:text-white hover:bg-black/30 transition-all duration-1000 z-20 border border-white/20"
          onClick={() => setIsPlaying(!isPlaying)}
          whileHover={{ 
            scale: prefersReducedMotion ? 1 : 1.05,
            backgroundColor: "rgba(0, 0, 0, 0.4)"
          }}
          whileTap={{ 
            scale: prefersReducedMotion ? 1 : 0.98
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut"
          }}
        >
          <motion.div
            animate={{ opacity: isPlaying ? 1 : 0.7 }}
            transition={{ duration: 0.8 }}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </motion.div>
        </motion.button>
      )}

      {/* Indicateurs très subtils */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
          {images.map((_, index) => (
            <motion.button
              key={index}
              className="relative rounded-full backdrop-blur-sm border border-white/20"
              onClick={() => goToSlide(index)}
              whileHover={{ 
                scale: prefersReducedMotion ? 1 : 1.1
              }}
              whileTap={{ 
                scale: prefersReducedMotion ? 1 : 0.95
              }}
              animate={{
                width: index === currentIndex ? 32 : 12,
                height: 12,
                backgroundColor: index === currentIndex ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.3)"
              }}
              transition={{
                duration: 1.2,
                ease: "easeInOut"
              }}
            >
              {index === currentIndex && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/80 to-white/60 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Barre de progression très subtile */}
      {isPlaying && !isHovered && images.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-white/40 via-white/60 to-white/40"
            key={`progress-${currentIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: autoPlayInterval / 1000, 
              ease: "linear"
            }}
          />
        </div>
      )}
    </div>
  );
}