/**
 * Script pour réinitialiser complètement la langue en français
 */

import fs from 'fs'
import path from 'path'

async function resetToFrench() {
  console.log('🇫🇷 Réinitialisation complète vers le français...')
  
  try {
    // 1. Créer un fichier de configuration temporaire
    const configContent = `
// Configuration temporaire pour forcer le français
export const FORCE_FRENCH = true;
export const DEFAULT_LANGUAGE = 'fr';
export const ALLOWED_LANGUAGES = ['fr', 'en']; // Exclure l'arabe temporairement
`
    
    fs.writeFileSync('lib/i18n/force-config.ts', configContent)
    console.log('✅ Configuration temporaire créée')

    // 2. Créer un script HTML pour nettoyer les cookies
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Réinitialisation Langue</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>🇫🇷 Réinitialisation en cours...</h1>
    <p>Nettoyage des cookies et définition du français...</p>
    
    <script>
        // Nettoyer tous les cookies liés à la langue
        document.cookie = 'language=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'i18nextLng=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Définir le français
        document.cookie = 'language=fr; path=/; max-age=31536000; SameSite=Lax';
        document.cookie = 'i18nextLng=fr; path=/; max-age=31536000; SameSite=Lax';
        
        // Nettoyer le localStorage
        localStorage.removeItem('i18nextLng');
        localStorage.setItem('i18nextLng', 'fr');
        
        // Rediriger vers l'application
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
    </script>
</body>
</html>
`
    
    fs.writeFileSync('public/reset-language.html', htmlContent)
    console.log('✅ Page de réinitialisation créée: /reset-language.html')

    // 3. Instructions
    console.log('\n📋 Instructions pour corriger le problème :')
    console.log('1. Arrêter le serveur de développement (Ctrl+C)')
    console.log('2. Redémarrer le serveur: npm run dev')
    console.log('3. Ouvrir: http://localhost:3000/reset-language.html')
    console.log('4. Attendre la redirection automatique')
    console.log('5. Vider le cache du navigateur (Ctrl+Shift+R)')

    console.log('\n🔧 Ou utiliser directement :')
    console.log('- Ouvrir scripts/force-french-language.html')
    console.log('- Cliquer sur "Forcer le Français"')

    console.log('\n✅ Réinitialisation préparée !')

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message)
  }
}

// Exécuter le script
resetToFrench()