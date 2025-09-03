/**
 * Script pour forcer le français côté serveur
 */

import fs from 'fs'
import path from 'path'

async function forceFrenchServer() {
  console.log('🇫🇷 Forçage du français côté serveur...')
  
  try {
    // 1. Créer un fichier de configuration forcée
    const configContent = `
// Configuration forcée pour le français
export const FORCE_FRENCH_CONFIG = {
  defaultLanguage: 'fr',
  fallbackLanguage: 'fr',
  forceLanguage: true,
  timestamp: ${Date.now()}
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
`
    
    fs.writeFileSync('lib/i18n/force-french.ts', configContent)
    console.log('✅ Configuration française forcée créée')

    // 2. Créer un fichier de réinitialisation des cookies
    const cookieResetContent = `
// Script de réinitialisation des cookies pour le français
export function resetToFrench() {
  if (typeof window !== 'undefined') {
    // Nettoyer tous les cookies de langue
    const cookiesToClear = ['language', 'i18nextLng', 'locale'];
    cookiesToClear.forEach(name => {
      document.cookie = \`\${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT\`;
    });
    
    // Définir le français
    document.cookie = 'language=fr; path=/; max-age=31536000; SameSite=Lax';
    document.cookie = 'i18nextLng=fr; path=/; max-age=31536000; SameSite=Lax';
    
    // LocalStorage
    try {
      localStorage.setItem('i18nextLng', 'fr');
      localStorage.setItem('language', 'fr');
    } catch(e) {}
    
    return true;
  }
  return false;
}

// Auto-exécution si dans le navigateur
if (typeof window !== 'undefined') {
  resetToFrench();
}
`
    
    fs.writeFileSync('lib/i18n/reset-french.ts', cookieResetContent)
    console.log('✅ Script de réinitialisation créé')

    // 3. Créer une page de redirection
    const redirectPageContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirection - Loft Algérie</title>
    <meta http-equiv="refresh" content="0;url=/dashboard">
    <script>
        // Configuration immédiate du français
        document.cookie = 'language=fr; path=/; max-age=31536000; SameSite=Lax';
        localStorage.setItem('i18nextLng', 'fr');
        
        // Redirection immédiate
        window.location.replace('/dashboard');
    </script>
</head>
<body>
    <p>Redirection vers l'application en français...</p>
</body>
</html>
`
    
    fs.writeFileSync('public/fr.html', redirectPageContent)
    console.log('✅ Page de redirection créée: /fr.html')

    // 4. Instructions
    console.log('\n📋 Solutions disponibles :')
    console.log('1. Ouvrir dans le navigateur: scripts/immediate-french-fix.html')
    console.log('2. Ou aller directement à: http://localhost:3000/fr.html')
    console.log('3. Ou utiliser: scripts/set-default-french.html')

    console.log('\n🔧 Actions recommandées :')
    console.log('1. Ouvrir scripts/immediate-french-fix.html (solution la plus rapide)')
    console.log('2. Attendre 3 secondes pour la redirection automatique')
    console.log('3. Vider le cache du navigateur si nécessaire (Ctrl+Shift+R)')

    console.log('\n✅ Configuration française forcée prête !')

  } catch (error) {
    console.error('❌ Erreur lors du forçage:', error.message)
  }
}

// Exécuter le script
forceFrenchServer()