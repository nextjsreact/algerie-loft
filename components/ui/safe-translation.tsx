'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface SafeTranslationProps {
  namespace: string;
  key: string;
  fallback: string;
  values?: Record<string, any>;
}

export function SafeTranslation({ namespace, key, fallback, values }: SafeTranslationProps) {
  try {
    const t = useTranslations(namespace);
    return t(key, values) || fallback;
  } catch (error) {
    return fallback;
  }
}

// Hook pour utilisation directe avec fallback robuste
export function useSafeTranslations(namespace: string) {
  const locale = useLocale();
  
  let t: any;
  try {
    t = useTranslations(namespace);
  } catch (error) {
    // Si useTranslations échoue, retourner directement le fallback
    return (key: string, fallback: string, values?: Record<string, any>) => fallback;
  }
  
  return (key: string, fallback: string, values?: Record<string, any>) => {
    try {
      const result = t(key, values);
      // Si la traduction retourne la clé elle-même (pas trouvée), utiliser le fallback
      if (result === `${namespace}.${key}` || !result) {
        return fallback;
      }
      return result;
    } catch (error) {
      return fallback;
    }
  };
}