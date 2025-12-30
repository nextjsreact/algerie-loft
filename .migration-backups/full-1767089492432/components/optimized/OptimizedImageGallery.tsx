'use client';

import React from 'react';
import { LazyImage, useIntersectionObserver } from '@/lib/performance/lazy-loading';
import { IMAGE_OPTIMIZATION } from '@/lib/performance/optimization-config';

interface OptimizedImageGalleryProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  columns?: number;
  className?: string;
  onImageClick?: (image: any) => void;
}

export function OptimizedImageGallery({
  images,
  columns = 3,
  className = '',
  onImageClick
}: OptimizedImageGalleryProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());

  // Précharge les images visibles
  const preloadImage = React.useCallback((src: string) => {
    if (loadedImages.has(src)) return;

    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(src));
    };
    img.src = src;
  }, [loadedImages]);

  // Gestionnaire de clic optimisé
  const handleImageClick = React.useCallback((image: any) => {
    setSelectedImage(image.id);
    onImageClick?.(image);
  }, [onImageClick]);

  return (
    <>
      <div 
        className={`grid gap-4 ${className}`}
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
        }}
      >
        {images.map((image) => (
          <OptimizedImageItem
            key={image.id}
            image={image}
            onClick={() => handleImageClick(image)}
            onVisible={() => preloadImage(image.src)}
          />
        ))}
      </div>

      {/* Modal d'image (si nécessaire) */}
      {selectedImage && (
        <ImageModal
          image={images.find(img => img.id === selectedImage)}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}

interface OptimizedImageItemProps {
  image: {
    id: string;
    src: string;
    alt: string;
    thumbnail?: string;
  };
  onClick: () => void;
  onVisible: () => void;
}

function OptimizedImageItem({ image, onClick, onVisible }: OptimizedImageItemProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const ref = useIntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
        onVisible();
      }
    }
  );

  return (
    <div
      ref={ref}
      className="relative aspect-square overflow-hidden rounded-lg bg-gray-200 cursor-pointer group"
      onClick={onClick}
    >
      {isVisible ? (
        <LazyImage
          src={image.thumbnail || image.src}
          alt={image.alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      )}
      
      {/* Overlay au hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
    </div>
  );
}

interface ImageModalProps {
  image?: {
    id: string;
    src: string;
    alt: string;
  };
  onClose: () => void;
}

function ImageModal({ image, onClose }: ImageModalProps) {
  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <img
          src={image.src}
          alt={image.alt}
          className="max-w-full max-h-full object-contain"
          loading="eager"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}