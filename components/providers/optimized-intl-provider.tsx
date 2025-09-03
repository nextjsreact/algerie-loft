'use client'

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  preloadRouteTranslations, 
  getNamespacesForRoute,
  cleanupCache,
  getCacheStats 
} from '@/lib/i18n-optimizations';
import { clearTranslationCache, getClientCacheStats } from '@/lib/hooks/use-cached-translations';

interface Props {
  children: ReactNode;
  locale: string;
  messages: any;
}

/**
 * Provider optimisé pour next-intl avec préchargement intelligent
 * et gestion avancée du cache
 */
export function OptimizedIntlProvider({ children, locale, messages }: Props) {
  const pathname = usePathname();
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    // Précharger les traductions pour la route actuelle
    const preloadTranslations = async () => {
      try {
        await preloadRouteTranslations(pathname, locale as any);
        setIsOptimized(true);
        
        // Log des statistiques de cache en développement
        if (process.env.NODE_ENV === 'development') {
          const serverStats = getCacheStats();
          const clientStats = getClientCacheStats();
          
          console.log('Translation Cache Stats:', {
            server: serverStats,
            client: clientStats,
            route: pathname,
            namespaces: getNamespacesForRoute(pathname)
          });
        }
      } catch (error) {
        console.warn('Failed to preload route translations:', error);
        setIsOptimized(true); // Continue même en cas d'erreur
      }
    };

    preloadTranslations();
  }, [pathname, locale]);

  useEffect(() => {
    // Nettoyage périodique du cache
    const cleanupInterval = setInterval(() => {
      cleanupCache(100); // Garder max 100 entrées
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Cache cleanup completed');
      }
    }, 5 * 60 * 1000); // Toutes les 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    // Nettoyer le cache lors du changement de langue
    const handleLanguageChange = () => {
      clearTranslationCache();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Translation cache cleared due to language change');
      }
    };

    // Écouter les changements de langue (via événements personnalisés)
    window.addEventListener('languageChange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, []);

  // Afficher un indicateur de chargement pendant l'optimisation (optionnel)
  if (!isOptimized && process.env.NODE_ENV === 'development') {
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          background: 'orange', 
          color: 'white', 
          padding: '4px 8px', 
          fontSize: '12px',
          zIndex: 9999 
        }}>
          Optimizing translations...
        </div>
        {children}
      </NextIntlClientProvider>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Hook pour déclencher manuellement le changement de langue
 */
export function useLanguageChange() {
  return (newLocale: string) => {
    // Déclencher l'événement de changement de langue
    window.dispatchEvent(new CustomEvent('languageChange', { 
      detail: { locale: newLocale } 
    }));
  };
}

/**
 * Hook pour obtenir les statistiques de performance des traductions
 */
export function useTranslationStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const updateStats = () => {
      const serverStats = getCacheStats();
      const clientStats = getClientCacheStats();
      
      setStats({
        server: serverStats,
        client: clientStats,
        timestamp: Date.now()
      });
    };

    updateStats();
    
    // Mettre à jour les stats toutes les 10 secondes en développement
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(updateStats, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  return stats;
}