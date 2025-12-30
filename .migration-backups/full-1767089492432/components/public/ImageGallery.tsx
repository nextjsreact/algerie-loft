'use client'

import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (index: number) => {
    setCurrentImage(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  // For demo, we'll use placeholder gradients
  const placeholderImages = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ];

  return (
    <>
      {/* Main Gallery */}
      <div className="grid grid-cols-2 gap-2">
        {placeholderImages.slice(0, 4).map((gradient, index) => (
          <div
            key={index}
            className="aspect-square rounded-lg cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
            style={{ background: gradient }}
            onClick={() => openLightbox(index)}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-2xl">🏠</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
          >
            ✕
          </button>

          {/* Previous Button */}
          <button
            onClick={prevImage}
            className="absolute left-4 text-white text-3xl hover:text-gray-300 z-10"
          >
            ‹
          </button>

          {/* Current Image */}
          <div
            className="max-w-4xl max-h-4xl w-full h-full mx-8 rounded-lg"
            style={{ background: placeholderImages[currentImage] }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-6xl">🏠</span>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={nextImage}
            className="absolute right-4 text-white text-3xl hover:text-gray-300 z-10"
          >
            ›
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
            {currentImage + 1} / {placeholderImages.length}
          </div>
        </div>
      )}
    </>
  );
}