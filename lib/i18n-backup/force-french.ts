
// Configuration forcée pour le français
export const FORCE_FRENCH_CONFIG = {
  defaultLanguage: 'fr',
  fallbackLanguage: 'fr',
  forceLanguage: true,
  timestamp: 1755627143945
};

// Fonction pour forcer le français
export function getForcedLanguage() {
  return 'fr';
}

// Middleware pour forcer le français
export function forceFrenchMiddleware(request) {
  return {
    language: 'fr',
    forced: true,
    timestamp: new Date().toISOString()
  };
}
