#!/usr/bin/env node

/**
 * Nettoyage complet des références owners
 * Supprime toutes les références à l'ancienne table
 */

import fs from 'fs';
import path from 'path';

console.log('🧹 Nettoyage complet des références owners...\n');

// Fichiers à nettoyer (scripts de migration et de test)
const filesToClean = [
  'scripts/analyze-schema-differences.ts',
  'scripts/auto-smart-clone.ts', 
  'scripts/auto-true-clone.ts',
  'scripts/check-customers-table.ts',
  'scripts/check-lofts-data.ts',
  'scripts/check-prod-data.ts',
  'scripts/check-schema-differences.ts',
  'scripts/check-prod-lofts.ts',
  'scripts/clone-data-backup.ts',
  'scripts/clone-data.ts',
  'scripts/compare-prod-dev.ts',
  'scripts/complete-sync-diagnosis.ts',
  'scripts/complete-table-sync.ts',
  'scripts/debug-clone.ts',
  'scripts/debug-production-issue.ts',
  'scripts/detailed-comparison.ts',
  'scripts/diagnose-schema-compatibility.ts'
];

// Fonction pour remplacer owners par owners dans un fichier
function cleanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Remplacements
    content = content.replace(/owners/g, 'owners');
    content = content.replace(/'owners'/g, "'owners'");
    content = content.replace(/"owners"/g, '"owners"');
    content = content.replace(/\`owners\`/g, '`owners`');
    
    // Cas spéciaux pour les commentaires
    content = content.replace(/Table owners/g, 'Table owners');
    content = content.replace(/table owners/g, 'table owners');
    content = content.replace(/Owners/g, 'Owners');
    
    if (content !== originalContent) {
      // Créer un backup
      fs.copyFileSync(filePath, `${filePath}.backup`);
      
      // Écrire le contenu nettoyé
      fs.writeFileSync(filePath, content);
      console.log(`✅ Nettoyé: ${filePath}`);
    } else {
      console.log(`ℹ️  Aucun changement: ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Erreur avec ${filePath}: ${error.message}`);
  }
}

// Nettoyer les fichiers de types si ils existent
function cleanTypeFiles() {
  const typeFiles = [
    'lib/types.ts',
    'lib/database.types.ts',
    'types/database.ts',
    'types/supabase.ts'
  ];

  typeFiles.forEach(file => {
    if (fs.existsSync(file)) {
      cleanFile(file);
    }
  });
}

// Nettoyer le cache Next.js et Supabase
function clearCaches() {
  console.log('\n🗑️  Nettoyage des caches...');
  
  const cacheDirs = [
    '.next',
    'node_modules/.cache',
    '.supabase'
  ];

  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Cache supprimé: ${dir}`);
      } catch (error) {
        console.log(`⚠️  Impossible de supprimer ${dir}: ${error.message}`);
      }
    }
  });
}

// Script principal de nettoyage
function main() {
  console.log('1️⃣  Nettoyage des scripts de migration...');
  filesToClean.forEach(cleanFile);
  
  console.log('\n2️⃣  Nettoyage des fichiers de types...');
  cleanTypeFiles();
  
  console.log('\n3️⃣  Nettoyage des caches...');
  clearCaches();
  
  console.log('\n4️⃣  Création d\'un script de test rapide...');
  
  // Créer un test rapide pour vérifier que tout fonctionne
  const quickTest = `#!/usr/bin/env node

/**
 * Test rapide après nettoyage owners
 */

console.log('🧪 Test rapide après nettoyage...');

async function testReportsAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/debug/database');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API debug fonctionne');
      console.log(\`📊 Owners trouvés: \${data.data?.owners?.count || 0}\`);
      console.log(\`📊 Lofts trouvés: \${data.data?.lofts?.count || 0}\`);
    } else {
      console.log('❌ Erreur API:', data.error);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
    console.log('💡 Assurez-vous que le serveur tourne: npm run dev');
  }
}

testReportsAPI();
`;

  fs.writeFileSync('test-after-cleanup.js', quickTest);
  console.log('✅ Script de test créé: test-after-cleanup.js');
  
  console.log('\n🎯 Nettoyage terminé !');
  console.log('\n📋 Prochaines étapes:');
  console.log('1. Redémarrez votre serveur: npm run dev');
  console.log('2. Testez: node test-after-cleanup.js');
  console.log('3. Vérifiez que l\'erreur "owners" a disparu');
  console.log('4. Testez la page des rapports');
  
  console.log('\n💡 Si l\'erreur persiste:');
  console.log('• Vérifiez le cache du navigateur (Ctrl+F5)');
  console.log('• Redémarrez complètement le serveur');
  console.log('• Vérifiez les types générés par Supabase');
}

main();