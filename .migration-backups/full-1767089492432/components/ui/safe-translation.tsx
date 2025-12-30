"use client";

import { useTranslations } from 'next-intl';

interface SafeTranslationProps {
  namespace?: string;
  keyPath: string;
  fallback?: string;
  values?: Record<string, any>;
}

/**
 * Composant de traduction sécurisé qui affiche un fallback au lieu de la clé brute
 * quand une traduction n'existe pas
 */
export function SafeTranslation({ 
  namespace = 'common', 
  keyPath, 
  fallback, 
  values 
}: SafeTranslationProps) {
  const t = useTranslations(namespace);
  
  try {
    const translation = t(keyPath, values);
    
    // Si la traduction retourne la clé elle-même, c'est qu'elle n'existe pas
    if (translation === keyPath || translation === `${namespace}.${keyPath}`) {
      return fallback || keyPath.split('.').pop() || keyPath;
    }
    
    return translation;
  } catch (error) {
    // En cas d'erreur, retourner le fallback ou la dernière partie de la clé
    return fallback || keyPath.split('.').pop() || keyPath;
  }
}

/**
 * Hook personnalisé pour les traductions sécurisées
 */
export function useSafeTranslation(namespace: string = 'common') {
  const t = useTranslations(namespace);
  
  return (keyPath: string, fallback?: string, values?: Record<string, any>) => {
    try {
      const translation = t(keyPath, values);
      
      // Si la traduction retourne la clé elle-même, c'est qu'elle n'existe pas
      if (translation === keyPath || translation === `${namespace}.${keyPath}`) {
        return fallback || keyPath.split('.').pop() || keyPath;
      }
      
      return translation;
    } catch (error) {
      return fallback || keyPath.split('.').pop() || keyPath;
    }
  };
}