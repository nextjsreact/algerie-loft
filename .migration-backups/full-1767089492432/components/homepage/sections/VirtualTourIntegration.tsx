'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  X, 
  Camera, 
  Eye,
  Navigation,
  RotateCcw
} from 'lucide-react';

interface VirtualTourIntegrationProps {
  loftId?: string;
  tourUrl?: string;
  previewImage?: string;
  locale: string;
}

export default function VirtualTourIntegration({ 
  loftId, 
  tourUrl, 
  previewImage,
  locale 
}: VirtualTourIntegrationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const content = {
    fr: {
      title: 'Visite Virtuelle 360°',
      subtitle: 'Explorez chaque détail de nos lofts depuis chez vous',
      startTour: 'Commencer la visite',
      closeTour: 'Fermer la visite',
      features: {
        immersive: 'Expérience immersive 360°',
        quality: 'Qualité HD professionnelle',
        interactive: 'Points d\'intérêt interactifs',
        navigation: 'Navigation intuitive'
      },
      controls: {
        play: 'Lecture',
        pause: 'Pause',
        mute: 'Couper le son',
        unmute: 'Activer le son',
        fullscreen: 'Plein écran',
        reset: 'Réinitialiser la vue'
      },
      availability: 'Disponible pour tous nos lofts',
      bookingCta: 'Réserver après la visite'
    },
    en: {
      title: '360° Virtual Tour',
      subtitle: 'Explore every detail of our lofts from home',
      startTour: 'Start tour',
      closeTour: 'Close tour',
      features: {
        immersive: '360° immersive experience',
        quality: 'Professional HD quality',
        interactive: 'Interactive points of interest',
        navigation: 'Intuitive navigation'
      },
      controls: {
        play: 'Play',
        pause: 'Pause',
        mute: 'Mute',
        unmute: 'Unmute',
        fullscreen: 'Fullscreen',
        reset: 'Reset view'
      },
      availability: 'Available for all our lofts',
      bookingCta: 'Book after tour'
    },
    ar: {
      title: 'جولة افتراضية 360°',
      subtitle: 'استكشف كل تفاصيل لوفتاتنا من منزلك',
      startTour: 'بدء الجولة',
      closeTour: 'إغلاق الجولة',
      features: {
        immersive: 'تجربة غامرة 360°',
        quality: 'جودة HD احترافية',
        interactive: 'نقاط اهتمام تفاعلية',
        navigation: 'تنقل بديهي'
      },
      controls: {
        play: 'تشغيل',
        pause: 'إيقاف مؤقت',
        mute: 'كتم الصوت',
        unmute: 'تشغيل الصوت',
        fullscreen: 'ملء الشاشة',
        reset: 'إعادة تعيين العرض'
      },
      availability: 'متاح لجميع لوفتاتنا',
      bookingCta: 'احجز بعد الجولة'
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const handleStartTour = () => {
    setShowTour(true);
    setIsPlaying(true);
  };

  const handleCloseTour = () => {
    setShowTour(false);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {text.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {text.subtitle}
        </p>
      </div>

      {/* Tour Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Preview Image */}
        <div className="relative h-64 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600">
          {previewImage ? (
            <img
              src={previewImage}
              alt="Virtual tour preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <p className="text-xl font-semibold">Aperçu de la visite virtuelle</p>
              </div>
            </div>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartTour}
              className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-6 shadow-2xl transition-all duration-300"
            >
              <Play className="w-12 h-12 ml-1" />
            </motion.button>
          </div>

          {/* 360° Badge */}
          <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            360°
          </div>

          {/* HD Quality Badge */}
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            HD
          </div>
        </div>

        {/* Tour Info */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(text.features).map(([key, feature], index) => (
              <div key={key} className="text-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  {key === 'immersive' && <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {key === 'quality' && <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {key === 'interactive' && <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {key === 'navigation' && <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{feature}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleStartTour}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {text.startTour}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Virtual Tour Modal */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`relative bg-black rounded-xl overflow-hidden ${
                isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-96 md:h-[600px]'
              }`}
            >
              {/* Tour Content */}
              <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                {tourUrl ? (
                  <iframe
                    src={tourUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Virtual Tour"
                  />
                ) : (
                  <div className="text-center text-white">
                    <Camera className="w-24 h-24 mx-auto mb-6 opacity-60" />
                    <h3 className="text-2xl font-bold mb-4">Visite Virtuelle 360°</h3>
                    <p className="text-lg opacity-80">
                      Explorez ce magnifique loft en détail
                    </p>
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                      {['Salon', 'Chambre', 'Cuisine', 'Salle de bain'].map((room, index) => (
                        <button
                          key={room}
                          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all duration-300"
                        >
                          <div className="text-sm font-medium">{room}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tour Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3 flex items-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-blue-400 transition-colors"
                    title={isPlaying ? text.controls.pause : text.controls.play}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-blue-400 transition-colors"
                    title={isMuted ? text.controls.unmute : text.controls.mute}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-blue-400 transition-colors"
                    title={text.controls.fullscreen}
                  >
                    <Maximize className="w-5 h-5" />
                  </button>

                  <button
                    className="text-white hover:text-blue-400 transition-colors"
                    title={text.controls.reset}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleCloseTour}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-300"
                  title={text.closeTour}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Availability Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <p className="text-blue-700 dark:text-blue-300 font-medium mb-4">
          {text.availability}
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
          {text.bookingCta}
        </button>
      </motion.div>
    </div>
  );
}