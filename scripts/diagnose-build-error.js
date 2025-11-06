#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script de diagnostic pour identifier les erreurs de build
 */
console.log('🔍 Diagnostic des erreurs de build...\n');

// 1. Vérifier la structure du fichier loft page
console.log('📁 Vérification du fichier loft page...');
const loftPagePath = 'app/[locale]/lofts/[id]/page.tsx';

try {
  const content = fs.readFileSync(loftPagePath, 'utf8');
  
  // Vérifications de base
  const hasRequire = content.includes('require(');
  const hasImport = content.includes('import ');
  const hasExport = content.includes('export default');
  const hasAsync = content.includes('async function');
  
  console.log(`   Contient require(): ${hasRequire ? '❌' : '✅'}`);
  console.log(`   Contient import: ${hasImport ? '✅' : '❌'}`);
  console.log(`   Contient export default: ${hasExport ? '✅' : '❌'}`);
  console.log(`   Fonction async: ${hasAsync ? '✅' : '❌'}`);
  
  // Vérifier les imports problématiques
  const imports = content.match(/import.*from.*/g) || [];
  console.log(`\n📦 Imports détectés (${imports.length}):`);
  imports.forEach(imp => {
    console.log(`   ${imp}`);
  });
  
  // Vérifier s'il y a des caractères non-ASCII problématiques
  const nonAsciiMatches = content.match(/[^\x00-\x7F]/g);
  if (nonAsciiMatches) {
    console.log(`\n⚠️  Caractères non-ASCII détectés: ${nonAsciiMatches.length}`);
    // Afficher les premiers caractères problématiques
    const uniqueChars = [...new Set(nonAsciiMatches)].slice(0, 10);
    console.log(`   Exemples: ${uniqueChars.join(', ')}`);
  } else {
    console.log('\n✅ Aucun caractère non-ASCII problématique');
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la lecture du fichier:', error.message);
}

// 2. Vérifier les composants importés
console.log('\n🔍 Vérification des composants importés...');

const componentsToCheck = [
  'components/audit/audit-history.tsx',
  'components/loft/bill-management.tsx',
  'components/lofts/loft-photo-gallery.tsx',
  'components/auth/role-based-access.tsx'
];

componentsToCheck.forEach(componentPath => {
  if (fs.existsSync(componentPath)) {
    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      const hasRequire = content.includes('require(');
      const hasModule = content.includes('module.exports');
      
      console.log(`   ${componentPath}: ${hasRequire || hasModule ? '❌ CommonJS' : '✅ ES Modules'}`);
      
      if (hasRequire) {
        const requireMatches = content.match(/require\([^)]+\)/g) || [];
        requireMatches.slice(0, 3).forEach(req => {
          console.log(`     - ${req}`);
        });
      }
    } catch (error) {
      console.log(`   ${componentPath}: ❌ Erreur de lecture`);
    }
  } else {
    console.log(`   ${componentPath}: ⚠️  Fichier non trouvé`);
  }
});

// 3. Vérifier le package.json
console.log('\n📦 Vérification du package.json...');
try {
  const packageContent = fs.readFileSync('package.json', 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  console.log(`   Type de module: ${packageJson.type || 'commonjs'}`);
  console.log(`   Version Next.js: ${packageJson.dependencies?.next || 'non trouvée'}`);
  
  // Vérifier s'il y a des dépendances problématiques
  const problematicDeps = [
    'require',
    'commonjs',
    'babel-node'
  ];
  
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const foundProblematic = Object.keys(deps).filter(dep => 
    problematicDeps.some(prob => dep.includes(prob))
  );
  
  if (foundProblematic.length > 0) {
    console.log(`   ⚠️  Dépendances potentiellement problématiques: ${foundProblematic.join(', ')}`);
  } else {
    console.log('   ✅ Aucune dépendance problématique détectée');
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la lecture du package.json:', error.message);
}

// 4. Suggestions de correction
console.log('\n💡 SUGGESTIONS DE CORRECTION:\n');

console.log('**Option 1 - Nettoyage complet:**');
console.log('   1. Fermez tous les processus Node.js');
console.log('   2. Supprimez .next et node_modules/.cache');
console.log('   3. Redémarrez: npm run dev');

console.log('\n**Option 2 - Vérification des imports:**');
console.log('   1. Vérifiez que tous les composants utilisent ES modules');
console.log('   2. Remplacez require() par import si nécessaire');
console.log('   3. Vérifiez les dépendances tierces');

console.log('\n**Option 3 - Mode de compatibilité:**');
console.log('   1. Ajoutez "type": "module" dans package.json si absent');
console.log('   2. Vérifiez la configuration Next.js');
console.log('   3. Utilisez des imports dynamiques si nécessaire');

console.log('\n**Si l\'erreur persiste:**');
console.log('   1. Vérifiez les logs complets de Next.js');
console.log('   2. Testez avec une version simplifiée du composant');
console.log('   3. Isolez le composant problématique');

console.log('\n✨ Diagnostic terminé !');