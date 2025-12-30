"use client"

import { useTranslations } from 'next-intl';
import { useTranslation as useI18nextTranslation } from '@/lib/i18n/context';

/**
 * Hook de transition pour migrer progressivement de i18next vers next-intl
 * 
 * Utilise next-intl par défaut, avec fallback vers i18next si nécessaire
 * Permet une migration composant par composant sans casser l'existant
 */
export function useMigrationTranslation(namespace?: string) {
  // Hook next-intl (nouveau système)
  const t = useTranslations(namespace);
  
  // Hook i18next (ancien système) comme fallback
  const { t: tFallback } = useI18nextTranslation(namespace ? [namespace] : undefined);
  
  return {
    t: (key: string, params?: any) => {
      try {
        // Essayer next-intl d'abord
        const result = t(key, params);
        
        // Si la traduction est identique à la clé, c'est probablement manquante
        if (result === key) {
          console.warn(`[Migration] Translation missing in next-intl for key: ${key}, falling back to i18next`);
          return tFallback(key, params) || key;
        }
        
        return result;
      } catch (error) {
        // En cas d'erreur avec next-intl, utiliser i18next
        console.warn(`[Migration] Error with next-intl for key: ${key}`, error);
        return tFallback(key, params) || key;
      }
    },
    
    // Fonction pour tester si une clé existe dans next-intl
    hasTranslation: (key: string) => {
      try {
        const result = t(key);
        return result !== key;
      } catch {
        return false;
      }
    },
    
    // Fonction pour obtenir la traduction brute (pour debug)
    getRawTranslation: (key: string, params?: any) => {
      return {
        nextIntl: (() => {
          try {
            return t(key, params);
          } catch (error) {
            return `Error: ${error}`;
          }
        })(),
        i18next: tFallback(key, params)
      };
    }
  };
}