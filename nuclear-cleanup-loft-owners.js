#!/usr/bin/env node

/**
 * NETTOYAGE NUCLÉAIRE des références owners
 * Supprime TOUTES les références, même dans les fichiers cachés
 */

import fs from 'fs';
import path from 'path';

console.log('☢️  NETTOYAGE NUCLÉAIRE owners...\n');

// Fonction pour nettoyer récursivement un dossier
function cleanDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx', '.json']) {
  if (!fs.existsSync(dirPath)) return;

  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Ignorer certains dossiers
      if (['node_modules', '.git', '.next'].includes(item)) continue;
      cleanDirectory(fullPath, extensions);
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (extensions.includes(ext)) {
        cleanFile(fullPath);
      }
    }
  }
}

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Remplacements agressifs
    content = content.replace(/owners/g, 'owners');
    content = content.replace(/'owners'/g, "'owners'");
    content = content.replace(/"owners"/g, '"owners"');
    content = content.replace(/\`owners\`/g, '`owners`');
    content = content.replace(/owners!/g, 'owners!');
    content = content.replace(/!owners/g, '!owners');
    
    // Cas spéciaux pour les jointures Supabase
    content = content.replace(/owners/g, 'owners');
    content = content.replace(/owners!\(/g, 'owners(');
    
    // Nettoyer les commentaires
    content = content.replace(/Table owners/g, 'Table owners');
    content = content.replace(/table owners/g, 'table owners');
    content = content.replace(/Owners/g, 'Owners');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`🧹 Nettoyé: ${filePath}`);
    }
  } catch (error) {
    // Ignorer les erreurs de fichiers non accessibles
  }
}

// Supprimer les fichiers de cache problématiques
function deleteCacheFiles() {
  console.log('🗑️  Suppression des fichiers de cache...');
  
  const filesToDelete = [
    'translation-analysis-advanced-report.json',
    'translation-analysis-report.json',
    'translation-verification-report.json',
    'language-mixing-diagnostic-report.json',
    'missing-translations-analysis.json',
    'mixed-language-debug-report.json',
    'hardcoded-text-report.json',
    'i18n-performance-report.json',
    'loft-page-translation-test.json',
    'real-translation-keys.json'
  ];

  filesToDelete.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`✅ Supprimé: ${file}`);
      } catch (error) {
        console.log(`⚠️  Impossible de supprimer ${file}: ${error.message}`);
      }
    }
  });
}

// Nettoyer les dossiers de cache
function cleanCacheDirs() {
  console.log('🧹 Nettoyage des dossiers de cache...');
  
  const cacheDirs = [
    '.next',
    'node_modules/.cache',
    '.turbo',
    '.vercel',
    '.swc'
  ];

  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Dossier supprimé: ${dir}`);
      } catch (error) {
        console.log(`⚠️  Impossible de supprimer ${dir}: ${error.message}`);
      }
    }
  });
}

// Créer un script de vérification
function createVerificationScript() {
  const verificationScript = `#!/usr/bin/env node

/**
 * Vérification post-nettoyage
 */

import { execSync } from 'child_process';

console.log('🔍 Vérification post-nettoyage...');

try {
  // Chercher toutes les références restantes
  const result = execSync('grep -r "owners" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.backup" 2>/dev/null || true', { encoding: 'utf-8' });
  
  if (result.trim()) {
    console.log('⚠️  Références restantes trouvées:');
    console.log(result);
  } else {
    console.log('✅ Aucune référence owners trouvée !');
  }
} catch (error) {
  console.log('ℹ️  Vérification terminée (grep non disponible sur Windows)');
}

// Test de l'API
async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/debug/database');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API debug fonctionne');
      console.log(\`📊 Owners: \${data.data?.owners?.count || 0}\`);
      console.log(\`📊 Lofts: \${data.data?.lofts?.count || 0}\`);
    } else {
      console.log('❌ Erreur API:', data.error);
    }
  } catch (error) {
    console.log('❌ Serveur non accessible:', error.message);
  }
}

testAPI();
`;

  fs.writeFileSync('verify-cleanup.js', verificationScript);
  console.log('✅ Script de vérification créé: verify-cleanup.js');
}

// Fonction principale
function main() {
  console.log('1️⃣  Suppression des fichiers de cache problématiques...');
  deleteCacheFiles();
  
  console.log('\n2️⃣  Nettoyage récursif de tous les fichiers...');
  cleanDirectory('.', ['.ts', '.tsx', '.js', '.jsx', '.json']);
  
  console.log('\n3️⃣  Suppression des dossiers de cache...');
  cleanCacheDirs();
  
  console.log('\n4️⃣  Création du script de vérification...');
  createVerificationScript();
  
  console.log('\n☢️  NETTOYAGE NUCLÉAIRE TERMINÉ !');
  console.log('\n📋 ÉTAPES CRITIQUES:');
  console.log('1. REDÉMARREZ COMPLÈTEMENT votre serveur');
  console.log('2. Videz le cache du navigateur (Ctrl+F5)');
  console.log('3. Testez: node verify-cleanup.js');
  console.log('4. Si l\'erreur persiste, redémarrez votre éditeur');
  
  console.log('\n⚠️  IMPORTANT:');
  console.log('• Tous les caches ont été supprimés');
  console.log('• Le prochain démarrage sera plus lent');
  console.log('• Mais l\'erreur owners devrait disparaître !');
}

main();