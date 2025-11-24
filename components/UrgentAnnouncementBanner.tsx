'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, AlertCircle, Megaphone } from 'lucide-react';
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
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchActiveAnnouncement();

    // Vérifier toutes les minutes si une nouvelle annonce est disponible
    const interval = setInterval(fetchActiveAnnouncement, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('urgent_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching announcement:', error);
        return;
      }

      if (data) {
        setAnnouncement(data);
        setIsVisible(true);
        setIsClosed(false);
      } else {
        setAnnouncement(null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClose = () => {
    setIsClosed(true);
    // Stocker dans localStorage pour ne pas réafficher pendant cette session
    if (announcement) {
      localStorage.setItem(`announcement_closed_${announcement.id}`, 'true');
    }
  };

  // Vérifier si l'annonce a déjà été fermée
  useEffect(() => {
    if (announcement) {
      const wasClosed = localStorage.getItem(`announcement_closed_${announcement.id}`);
      if (wasClosed === 'true') {
        setIsClosed(true);
      }
    }
  }, [announcement]);

  if (!announcement || isClosed) return null;

  const getMessage = () => {
    switch (locale) {
      case 'fr':
        return announcement.message_fr;
      case 'en':
        return announcement.message_en;
      case 'ar':
        return announcement.message_ar;
      default:
        return announcement.message_fr;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 shadow-lg"
          style={{
            backgroundColor: announcement.background_color,
            color: announcement.text_color,
          }}
        >
          <div className="relative overflow-hidden py-3">
            {/* Texte défilant */}
            <motion.div
              className="flex items-center justify-center space-x-4"
              animate={{
                x: [0, -20, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Megaphone className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm md:text-base font-semibold whitespace-nowrap">
                {getMessage()}
              </span>
              <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            </motion.div>

            {/* Bouton fermer */}
            <button
              onClick={handleClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Fermer l'annonce"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barre de progression (temps restant) */}
          <motion.div
            className="h-1 bg-white/30"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{
              duration: calculateTimeRemaining(announcement.end_date),
              ease: "linear",
            }}
            style={{ transformOrigin: "left" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Calculer le temps restant en secondes
function calculateTimeRemaining(endDate: string): number {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const remaining = (end - now) / 1000;
  return Math.max(remaining, 0);
}
