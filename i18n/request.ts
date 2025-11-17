import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'fr', 'ar'];

// 🚀 OPTIMISATION: Utiliser les fichiers optimisés en développement pour des chargements plus rapides
// En production, on utilise les fichiers complets pour garantir toutes les traductions
const useOptimizedTranslations = process.env.NODE_ENV === 'development';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Charger les traductions optimisées en dev, complètes en prod
  const translationFile = useOptimizedTranslations 
    ? `../messages/${locale}-optimized.json`
    : `../messages/${locale}.json`;

  try {
    return {
      messages: (await import(translationFile)).default
    };
  } catch (error) {
    // Fallback vers les fichiers complets si les optimisés n'existent pas
    console.warn(`Failed to load ${translationFile}, falling back to full translations`);
    return {
      messages: (await import(`../messages/${locale}.json`)).default
    };
  }
});