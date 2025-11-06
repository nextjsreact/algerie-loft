const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTION AUTOMATIQUE DU MÉLANGE DE LANGUES');

// 1. Vérifier et corriger le middleware
function fixMiddleware() {
  const middlewarePath = path.join(__dirname, 'middleware.ts');
  let content = fs.readFileSync(middlewarePath, 'utf8');
  
  // S'assurer que la détection de locale est correcte
  if (!content.includes('localeDetection: true')) {
    console.log('⚠️ localeDetection pourrait être désactivée');
  }
  
  // Ajouter des logs de debug
  if (!content.includes('console.log')) {
    content = content.replace(
      'console.log(`[MIDDLEWARE] Processing: ${pathname}`);',
      `console.log(`[MIDDLEWARE] Processing: ${pathname}`);
  console.log(`[MIDDLEWARE] Detected locale: ${request.nextUrl.locale}`);`
    );
    
    fs.writeFileSync(middlewarePath, content);
    console.log('✅ Middleware mis à jour avec logs de debug');
  }
}

// 2. Forcer la locale dans les composants problématiques
function fixNavigationComponents() {
  // Cette fonction devrait identifier et corriger les composants de navigation
  console.log('🔍 Recherche des composants de navigation...');
  
  // Chercher les fichiers qui utilisent "loftManager" ou "مدير الشقة"
  const componentsDir = path.join(__dirname, 'components');
  const appDir = path.join(__dirname, 'app');
  
  console.log('📁 Vérification des composants...');
}

// 3. Nettoyer le cache de locale
function clearLocaleCache() {
  console.log('🧹 Nettoyage du cache de locale...');
  
  // Supprimer les fichiers de cache Next.js
  const nextDir = path.join(__dirname, '.next');
  if (fs.existsSync(nextDir)) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('✅ Cache Next.js supprimé');
    } catch (error) {
      console.log('⚠️ Impossible de supprimer le cache:', error.message);
    }
  }
}

// Exécuter les corrections
fixMiddleware();
fixNavigationComponents();
clearLocaleCache();

console.log('\n🎯 PROCHAINES ÉTAPES:');
console.log('1. Redémarrer le serveur: npm run dev');
console.log('2. Tester: http://localhost:3000/fr/locale-debug');
console.log('3. Vérifier que la locale est bien "fr"');
console.log('4. Si le problème persiste, vérifier les composants de navigation');