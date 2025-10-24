'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

interface SmoothSlideCarouselProps {
  images?: LoftImage[];
  autoPlayInterval?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
}

export default function SmoothSlideCarousel({
  images: propImages,
  autoPlayInterval = 5000,
  showNavigation = true,
  showDots = true,
  className = ''
}: SmoothSlideCarouselProps) {
  const { images: loftImages, loading: imagesLoading } = useLoftImages();
  const images = propImages || loftImages;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-play avec glissement smooth
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
  };  if
 (imagesLoading) {
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
      {/* Container de glissement horizontal optimisé pour la netteté */}
      <motion.div
        className="flex w-full h-full"
        animate={{
          x: `${-currentIndex * 100}%`
        }}
        transition={{
          type: "spring",
          stiffness: 200,      // Plus ferme pour des transitions nettes
          damping: 30,         // Amortissement optimal
          mass: 0.8,           // Masse légère
          duration: 1.0        // Durée optimisée
        }}

      >
        {images.map((image, index) => (
          <motion.div
            key={index}
            className="relative w-full h-full flex-shrink-0"
          >
            {/* Image sans Ken Burns pour éviter le flou */}
            <div 
              className="w-full h-full"

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
            </div>
            
            {/* Overlay dégradé */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            
            {/* Informations de l'image */}
            {(image.title || image.description) && (
              <motion.div
                className="absolute bottom-8 left-8 right-8 text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: index === currentIndex ? 1 : 0,
                  y: index === currentIndex ? 0 : 30
                }}
                transition={{ 
                  duration: 0.8,
                  delay: index === currentIndex ? 0.3 : 0,
                  ease: "easeOut"
                }}
              >
                <div className="backdrop-blur-sm bg-black/30 rounded-2xl p-6 border border-white/20">
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
      </motion.div>     
 {/* Contrôles de navigation */}
      {showNavigation && images.length > 1 && (
        <>
          <motion.button
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-md bg-black/30 text-white hover:bg-black/50 transition-all duration-500 z-20 border border-white/30 shadow-xl"
            onClick={goToPrev}
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.1,
              backgroundColor: "rgba(0, 0, 0, 0.6)"
            }}
            whileTap={{ 
              scale: prefersReducedMotion ? 1 : 0.95
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
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-md bg-black/30 text-white hover:bg-black/50 transition-all duration-500 z-20 border border-white/30 shadow-xl"
            onClick={goToNext}
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.1,
              backgroundColor: "rgba(0, 0, 0, 0.6)"
            }}
            whileTap={{ 
              scale: prefersReducedMotion ? 1 : 0.95
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
          className="absolute top-6 right-6 p-3 rounded-full backdrop-blur-md bg-black/30 text-white hover:bg-black/50 transition-all duration-500 z-20 border border-white/30 shadow-xl"
          onClick={() => setIsPlaying(!isPlaying)}
          whileHover={{ 
            scale: prefersReducedMotion ? 1 : 1.1,
            backgroundColor: "rgba(0, 0, 0, 0.6)"
          }}
          whileTap={{ 
            scale: prefersReducedMotion ? 1 : 0.95
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {images.map((_, index) => (
            <motion.button
              key={index}
              className="relative rounded-full backdrop-blur-sm border border-white/30"
              onClick={() => goToSlide(index)}
              whileHover={{ 
                scale: prefersReducedMotion ? 1 : 1.2
              }}
              whileTap={{ 
                scale: prefersReducedMotion ? 1 : 0.9
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
                duration: 0.6
              }}
            >
              {index === currentIndex && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 via-white to-blue-400 rounded-full opacity-70"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.7 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Barre de progression */}
      {isPlaying && !isHovered && images.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 via-white to-blue-400"
            key={`progress-${currentIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: autoPlayInterval / 1000, 
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{
              x: ['-32px', '100%']
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
    </div>
  );
}