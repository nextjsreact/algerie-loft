"use client";

import { format } from 'date-fns';
import { fr, ar, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

/**
 * 🎯 UTILITAIRE CENTRALISÉ DE FORMATAGE DES DATES
 * 
 * Cet utilitaire résout DÉFINITIVEMENT le problème de localisation des dates
 * en utilisant automatiquement la locale actuelle de Next-intl.
 * 
 * FINI LES CATASTROPHES DE TRADUCTION ! 🚀
 */

// Helper pour obtenir la locale date-fns correspondante
export const getDateFnsLocale = (locale: string) => {
  switch (locale) {
    case 'ar': return ar;
    case 'fr': return fr; 
    case 'en': return enUS;
    default: return fr; // Fallback sûr
  }
};

// Helper pour obtenir la locale browser correspondante
export const getBrowserLocale = (locale: string) => {
  switch (locale) {
    case 'ar': return 'ar-DZ';
    case 'fr': return 'fr-FR';
    case 'en': return 'en-US';
    default: return 'fr-FR'; // Fallback sûr
  }
};

/**
 * Hook pour formatage des dates avec locale automatique
 */
export const useDateFormat = () => {
  const locale = useLocale();
  
  return {
    // Format court : "20 Aug 2024"
    formatShort: (date: string | Date) => {
      return format(new Date(date), "d MMM yyyy", { 
        locale: getDateFnsLocale(locale) 
      });
    },
    
    // Format moyen : "20 août 2024, 14:30"
    formatMedium: (date: string | Date) => {
      return format(new Date(date), "d MMM yyyy, HH:mm", { 
        locale: getDateFnsLocale(locale) 
      });
    },
    
    // Format long : "lundi 20 août 2024"
    formatLong: (date: string | Date) => {
      return format(new Date(date), "EEEE d MMMM yyyy", { 
        locale: getDateFnsLocale(locale) 
      });
    },
    
    // Format natif localisé du navigateur
    formatNative: (date: string | Date) => {
      return new Date(date).toLocaleDateString(getBrowserLocale(locale));
    },
    
    // Format heure seulement : "14:30"
    formatTime: (date: string | Date) => {
      return format(new Date(date), "HH:mm", { 
        locale: getDateFnsLocale(locale) 
      });
    },
    
    // Format relatif : "il y a 2 heures"
    formatRelative: (date: string | Date) => {
      // Pour plus tard avec formatDistanceToNow
      return format(new Date(date), "d MMM", { 
        locale: getDateFnsLocale(locale) 
      });
    }
  };
};

/**
 * Fonctions utilitaires directes (pour composants server-side)
 */
export const formatDateShort = (date: string | Date, locale: string = 'fr') => {
  return format(new Date(date), "d MMM yyyy", { 
    locale: getDateFnsLocale(locale) 
  });
};

export const formatDateNative = (date: string | Date, locale: string = 'fr') => {
  return new Date(date).toLocaleDateString(getBrowserLocale(locale));
};

export const formatDateLong = (date: string | Date, locale: string = 'fr') => {
  return format(new Date(date), "EEEE d MMMM yyyy", { 
    locale: getDateFnsLocale(locale) 
  });
};