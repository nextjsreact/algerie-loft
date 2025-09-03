'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { preloadAllMessages } from '@/lib/i18n-optimizations';

export function TranslationPreloader() {
  const pathname = usePathname();

  useEffect(() => {
    // Précharger toutes les traductions en arrière-plan
    preloadAllMessages().catch(error => {
      console.warn('Failed to preload translations:', error);
    });
  }, []);

  // Précharger les traductions pour les routes probables basées sur la route actuelle
  useEffect(() => {
    const preloadRouteTranslations = async () => {
      const routesToPreload = getRelatedRoutes(pathname);
      
      // Précharger les namespaces pour ces routes
      routesToPreload.forEach(route => {
        // Cette logique pourrait être étendue pour précharger spécifiquement
        // les traductions des routes connexes
      });
    };

    preloadRouteTranslations();
  }, [pathname]);

  return null; // Ce composant ne rend rien
}

// Fonction pour déterminer les routes connexes à précharger
function getRelatedRoutes(currentPath: string): string[] {
  // Supprimer le préfixe de locale
  const cleanPath = currentPath.replace(/^\/[a-z]{2}/, '') || '/';
  
  // Définir les routes connexes basées sur la route actuelle
  const relatedRoutes: Record<string, string[]> = {
    '/dashboard': ['/lofts', '/transactions', '/teams'],
    '/lofts': ['/dashboard', '/transactions', '/reservations'],
    '/transactions': ['/dashboard', '/lofts', '/reports'],
    '/login': ['/dashboard'],
    '/': ['/dashboard', '/lofts']
  };

  return relatedRoutes[cleanPath] || [];
}