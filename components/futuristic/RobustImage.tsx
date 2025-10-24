'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface RobustImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Image de fallback SVG élégante
const FALLBACK_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8Y2lyY2xlIGN4PSI5NjAiIGN5PSI0NDAiIHI9IjgwIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPHN2ZyB4PSI5MjAiIHk9IjQwMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIj4KPHA+PHBhdGggZD0ibTkgMTAgMy0zIDMgM20tNiAwIDMtMyAzIDNtLTYgMGgxMnYxMEg2VjEwWiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9wPgo8L3N2Zz4KPHR1ZXh0IHg9Ijk2MCIgeT0iNTgwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTG9mdDwvdGV4dD4KPGR1ZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjE5MjAiIHkyPSIxMDgwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM2MzY2ZjEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjOGI1Y2Y2Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+';

export const RobustImage: React.FC<RobustImageProps> = ({
  src,
  alt,
  title,
  className = '',
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  onLoad,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    console.warn(`⚠️ Erreur de chargement d'image: ${src}`);
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const imageSrc = imageError ? FALLBACK_SVG : src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton de chargement */}
      {isLoading && !imageError && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Image principale avec optimisations anti-flou */}
      <Image
        src={imageSrc}
        alt={alt}
        title={title}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${imageError ? 'opacity-80' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          objectFit: 'cover',
          objectPosition: 'center'
        }}
      />

      {/* Indicateur d'erreur */}
      {imageError && (
        <motion.div
          className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full opacity-75"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          Fallback
        </motion.div>
      )}

      {/* Overlay de chargement avec animation */}
      {isLoading && !imageError && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default RobustImage;