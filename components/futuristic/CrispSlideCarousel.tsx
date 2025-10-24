'use client';

import { useState, useEffect, useRef } from 'react';
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

interface CrispSlideCarouselProps {
  images?: LoftImage[];
  autoPlayInterval?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
}

export default function CrispSlideCarousel({
  images: propImages,
  autoPlayInterval = 5000,
  showNavigation = true,
  showDots = true,
  className = ''
}: CrispSlideCarouselProps) {
  const { images: loftImages, loading: imagesLoading } = useLoftImages();
  const images = propImages || loftImages;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-play
  useEffect(() => {
    if (isPlaying && !isHovered && images.length > 1 && !isTransitioning) {
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
  }, [isPlaying, isHovered, autoPlayInterval, images.length, isTransitioning]);

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 1200); // Durée de la transition
  };

  const goToPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 1200);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 1200);
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
    >
      {/* Container de glissement avec position absolue - PAS de transform */}
      <div className="relative w-full h-full">
        {images.map((image, index) => {
          // Calcul de la position sans transform
          const position = (index - currentIndex) * 100;
          
          return (
            <div
              key={index}
              className="absolute top-0 w-full h-full"
              style={{
                left: `${position}%`,
                transition: isTransitioning ? 'left 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
                // Pas de transform du tout !
              }}
            >
              {/* Image sans aucune transformation */}
              <div className="w-full h-full">
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
                <div
                  className="absolute bottom-8 left-8 right-8 text-white transition-opacity duration-300"
                  style={{
                    opacity: index === currentIndex ? 1 : 0
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
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contrôles de navigation */}
      {showNavigation && images.length > 1 && (
        <>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-md bg-black/30 text-white hover:bg-black/50 transition-all duration-300 z-20 border border-white/30 shadow-xl disabled:opacity-50"
            onClick={goToPrev}
            disabled={isTransitioning}
          >
            <ChevronLeft size={28} />
          </button>

          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-md bg-black/30 text-white hover:bg-black/50 transition-all duration-300 z-20 border border-white/30 shadow-xl disabled:opacity-50"
            onClick={goToNext}
            disabled={isTransitioning}
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Bouton Play/Pause */}
      {images.length > 1 && (
        <button
          className="absolute top-6 right-6 p-3 rounded-full backdrop-blur-md bg-black/30 text-white hover:bg-black/50 transition-all duration-300 z-20 border border-white/30 shadow-xl"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          <div
            style={{
              transition: 'transform 0.4s ease',
              transform: isPlaying ? 'rotate(0deg)' : 'rotate(90deg)'
            }}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </div>
        </button>
      )}

      {/* Indicateurs de navigation */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              className="relative rounded-full backdrop-blur-sm border border-white/30 transition-all duration-300 disabled:opacity-50"
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              style={{
                width: index === currentIndex ? 40 : 16,
                height: 16,
                backgroundColor: index === currentIndex ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)",
                transition: 'all 0.3s ease'
              }}
            >
              {index === currentIndex && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 via-white to-blue-400 rounded-full opacity-70"
                  style={{
                    transition: 'opacity 0.3s ease'
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Barre de progression */}
      {isPlaying && !isHovered && images.length > 1 && !isTransitioning && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 via-white to-blue-400"
            style={{
              width: '0%',
              animation: `progressBar ${autoPlayInterval}ms linear forwards`
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}