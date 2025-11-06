const fs = require('fs');
const path = require('path');

console.log('🧹 NETTOYAGE DU CACHE DES TRADUCTIONS\n');

// 1. Nettoyer le cache Next.js
console.log('🗂️ Nettoyage du cache Next.js...');
const nextCacheDir = path.join(__dirname, '.next');
if (fs.existsSync(nextCacheDir)) {
  try {
    // Supprimer le dossier cache de manière récursive
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log('✅ Cache Next.js supprimé');
  } catch (error) {
    console.log('⚠️ Impossible de supprimer le cache Next.js:', error.message);
  }
} else {
  console.log('ℹ️ Pas de cache Next.js trouvé');
}

// 2. Nettoyer node_modules/.cache
console.log('\n📦 Nettoyage du cache node_modules...');
const nodeModulesCacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(nodeModulesCacheDir)) {
  try {
    fs.rmSync(nodeModulesCacheDir, { recursive: true, force: true });
    console.log('✅ Cache node_modules supprimé');
  } catch (error) {
    console.log('⚠️ Impossible de supprimer le cache node_modules:', error.message);
  }
} else {
  console.log('ℹ️ Pas de cache node_modules trouvé');
}

// 3. Vérifier les fichiers de traduction pour corruption
console.log('\n🔍 Vérification de l\'intégrité des fichiers de traduction...');
const locales = ['fr', 'en', 'ar'];
let corruptedFiles = [];

locales.forEach(locale => {
  const filePath = path.join(__dirname, 'messages', `${locale}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content); // Test de parsing
    console.log(`✅ ${locale}.json - Intègre`);
  } catch (error) {
    console.log(`❌ ${locale}.json - Corrompu: ${error.message}`);
    corruptedFiles.push(locale);
  }
});

// 4. Créer un script de redémarrage propre
console.log('\n📝 Création du script de redémarrage...');
const restartScript = `@echo off
echo 🧹 Nettoyage complet et redémarrage...
echo.

echo 🛑 Arrêt des processus Node.js...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🗂️ Suppression des caches...
if exist .next rmdir /s /q .next
if exist node_modules\\.cache rmdir /s /q node_modules\\.cache
if exist .swc rmdir /s /q .swc

echo 📦 Réinstallation des dépendances...
npm ci --silent

echo 🚀 Redémarrage du serveur de développement...
npm run dev

pause`;

fs.writeFileSync('restart-clean.bat', restartScript);
console.log('✅ Script restart-clean.bat créé');

// 5. Créer un composant de test pour les traductions
console.log('\n🧪 Création d\'un composant de test...');
const testComponent = `'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

export default function TranslationTest() {
  const t = useTranslations('lofts')
  const [testResults, setTestResults] = useState<string[]>([])
  
  useEffect(() => {
    const results = []
    
    // Test des clés problématiques
    const testKeys = ['editLoft', 'updatePropertyDetails', 'addLoft']
    
    testKeys.forEach(key => {
      try {
        const value = t(key)
        results.push(\`✅ \${key}: "\${value}"\`)
      } catch (error) {
        results.push(\`❌ \${key}: ERROR - \${error.message}\`)
      }
    })
    
    setTestResults(results)
  }, [t])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Test des Traductions</h1>
      <div>
        <h2>Namespace: lofts</h2>
        {testResults.map((result, index) => (
          <div key={index} style={{ 
            color: result.startsWith('✅') ? 'green' : 'red',
            margin: '5px 0'
          }}>
            {result}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Test direct:</h2>
        <p>editLoft: {t('editLoft')}</p>
        <p>updatePropertyDetails: {t('updatePropertyDetails')}</p>
      </div>
    </div>
  )
}`;

const testPageDir = path.join(__dirname, 'app', '[locale]', 'test-translations');
if (!fs.existsSync(testPageDir)) {
  fs.mkdirSync(testPageDir, { recursive: true });
}

fs.writeFileSync(path.join(testPageDir, 'page.tsx'), testComponent);
console.log('✅ Page de test créée: /test-translations');

// 6. Résumé et recommandations
console.log('\n📋 RÉSUMÉ ET RECOMMANDATIONS:');

if (corruptedFiles.length > 0) {
  console.log(`❌ Fichiers corrompus détectés: ${corruptedFiles.join(', ')}`);
  console.log('   → Restaurer ces fichiers depuis une sauvegarde');
} else {
  console.log('✅ Tous les fichiers de traduction sont intègres');
}

console.log('\n🔧 Actions recommandées:');
console.log('1. Exécuter: restart-clean.bat (nettoyage complet)');
console.log('2. Visiter: http://localhost:3000/fr/test-translations');
console.log('3. Vérifier les traductions dans le navigateur');
console.log('4. Si le problème persiste, vérifier le cache du navigateur');

console.log('\n🏁 Nettoyage terminé');