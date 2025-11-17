import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'fr', 'ar'];

import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'fr', 'ar'];

// 🚀 OPTIMISATION: Désactivé temporairement car fichiers optimisés incomplets
// Les fichiers optimisés seront utilisés plus tard avec code splitting par namespace
const useOptimizedTranslations = false; // Désactivé pour éviter les traductions manquantes

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    // Utiliser les fichiers complets pour garantir toutes les traductions
    messages: (await import(`../messages/${locale}.json`)).default
  };
});