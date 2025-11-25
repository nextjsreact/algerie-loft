'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, AlertCircle, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
  id: string;
  message_fr: string;
  message_en: string;
  message_ar: string;
  background_color: string;
  text_color: string;
  end_date: string;
}

interface UrgentAnnouncementBannerProps {
  locale: string;
}

export default function UrgentAnnouncementBanner({ locale }: UrgentAnnouncementBannerProps) {
  // Tous les useState ensemble
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Tous les useRef ensemble
  const textRef = useRef<HTMLSpanElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fonctions helper
  const fetchActiveAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('urgent_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        return;
      }

      if (data && data.length > 0) {
        setAnnouncements(data);
        setIsVisible(true);
        setIsClosed(false);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClose = () => {
    setIsClosed(true);
    const currentAnnouncement = announcements[currentIndex];
    if (currentAnnouncement) {
      localStorage.setItem(`announcement_closed_${currentAnnouncement.id}`, 'true');
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Tous les useEffect ensemble - AVANT tout return conditionnel
  // 1. Réinitialiser l'état fermé quand la langue change
  useEffect(() => {
    setIsClosed(false);
  }, [locale]);

  // 2. Vérifier si l'annonce actuelle a déjà été fermée
  useEffect(() => {
    const currentAnnouncement = announcements[currentIndex];
    if (currentAnnouncement) {
      const wasClosed = localStorage.getItem(`announcement_closed_${currentAnnouncement.id}`);
      if (wasClosed === 'true') {
        setIsClosed(true);
      } else {
        setIsClosed(false);
      }
    }
  }, [announcements, currentIndex]);

  // 3. Mesurer la largeur du texte et la hauteur de la banderole
  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.offsetWidth);
    }
    if (bannerRef.current) {
      setBannerHeight(bannerRef.current.offsetHeight);
    }
  }, [announcements, currentIndex, locale]);

  // 4. Ajouter un padding-top au body
  useEffect(() => {
    if (announcements.length > 0 && !isClosed && bannerHeight > 0) {
      document.body.style.paddingTop = `${bannerHeight}px`;
    } else {
      document.body.style.paddingTop = '0px';
    }

    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, [announcements.length, isClosed, bannerHeight]);

  // 5. Fetch initial et polling
  useEffect(() => {
    fetchActiveAnnouncements();
    const interval = setInterval(fetchActiveAnnouncements, 60000);
    return () => clearInterval(interval);
  }, []);

  // 6. Rotation automatique des annonces
  useEffect(() => {
    if (announcements.length > 1) {
      const rotationInterval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, 5000);
      return () => clearInterval(rotationInterval);
    }
  }, [announcements.length]);

  // Early returns APRÈS tous les hooks
  if (announcements.length === 0 || isClosed) return null;

  const currentAnnouncement = announcements[currentIndex];
  
  if (!currentAnnouncement) return null;

  const getMessage = () => {
    switch (locale) {
      case 'fr':
        return currentAnnouncement.message_fr;
      case 'en':
        return currentAnnouncement.message_en;
      case 'ar':
        return currentAnnouncement.message_ar;
      default:
        return currentAnnouncement.message_fr;
    }
  };

  const message = getMessage();
  
  // Calculer la durée en fonction de la largeur réelle (50 pixels par seconde)
  const duration = textWidth > 0 ? Math.max(textWidth / 50, 10) : 20;
  
  // Direction du défilement : RTL pour l'arabe, LTR pour les autres
  const isRTL = locale === 'ar';
  const animationValues = textWidth > 0 
    ? (isRTL ? [0, textWidth] : [0, -textWidth])
    : (isRTL ? [0, 1000] : [0, -1000]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={bannerRef}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 shadow-lg"
          style={{
            backgroundColor: currentAnnouncement.background_color,
            color: currentAnnouncement.text_color,
          }}
        >
          <div className="relative overflow-hidden py-3">
            {/* Conteneur avec animation CSS pour un défilement fluide */}
            <div className="flex items-center">
              {/* Bouton pause/play */}
              <button
                onClick={togglePause}
                className="flex-shrink-0 ml-4 mr-3 p-1.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200 hover:scale-110 group"
                aria-label={isPaused ? "Reprendre le défilement" : "Mettre en pause"}
                title={isPaused ? "Reprendre" : "Pause"}
              >
                {isPaused ? (
                  <Play className="w-4 h-4 transition-all duration-200 fill-current" />
                ) : (
                  <Pause className="w-4 h-4 transition-all duration-200" />
                )}
              </button>
              <div className="flex-1 overflow-hidden relative">
                <motion.div 
                  className="flex whitespace-nowrap"
                  animate={isPaused ? {} : {
                    x: animationValues,
                  }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                  }}
                >
                  <span className="text-sm md:text-base font-semibold inline-block pr-20">
                    {message}
                  </span>
                  <span ref={textRef} className="text-sm md:text-base font-semibold inline-block pr-20">
                    {message}
                  </span>
                  <span className="text-sm md:text-base font-semibold inline-block pr-20">
                    {message}
                  </span>
                </motion.div>
              </div>
              <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse ml-3 mr-4" />
            </div>

            {/* Bouton fermer stylisé */}
            <button
              onClick={handleClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200 hover:scale-110 group"
              aria-label="Fermer l'annonce"
              title="Fermer"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* Indicateurs de pagination si plusieurs annonces */}
          {announcements.length > 1 && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                  aria-label={`Annonce ${index + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


