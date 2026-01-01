#!/usr/bin/env node

/**
 * NETTOYAGE DES LOGS CONSOLE NINJA
 * ================================
 * 
 * Console Ninja pollue les logs avec des codes oo_oo
 * Ce script nettoie et désactive Console Ninja
 */

import fs from 'fs';
import path from 'path';

console.log('🧹 Nettoyage des logs Console Ninja...\n');

// 1. Vérifier si Console Ninja est actif
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.dependencies?.['console-ninja'] || packageJson.devDependencies?.['console-ninja']) {
    console.log('❌ Console Ninja détecté dans package.json');
    console.log('   → Supprimez-le avec: npm uninstall console-ninja');
  } else {
    console.log('✅ Console Ninja pas dans package.json');
  }
}

// 2. Vérifier les fichiers de configuration
const configFiles = [
  '.vscode/settings.json',
  'next.config.mjs',
  'next.config.js'
];

configFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('console-ninja') || content.includes('consoleNinja')) {
      console.log(`⚠️  Console Ninja trouvé dans ${filePath}`);
    } else {
      console.log(`✅ ${filePath} propre`);
    }
  }
});

// 3. Nettoyer les dossiers de cache
const cacheDirs = [
  'node_modules/.cache/console-ninja',
  '.console-ninja',
  '.next'
];

cacheDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Supprimé: ${dir}`);
    } catch (error) {
      console.log(`❌ Erreur suppression ${dir}:`, error.message);
    }
  } else {
    console.log(`✅ ${dir} n'existe pas`);
  }
});

// 4. Créer un .env.local pour désactiver Console Ninja
const envLocalPath = '.env.local';
let envContent = '';

if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
}

if (!envContent.includes('DISABLE_CONSOLE_NINJA')) {
  envContent += '\n# Désactiver Console Ninja\nDISABLE_CONSOLE_NINJA=true\n';
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ DISABLE_CONSOLE_NINJA ajouté à .env.local');
} else {
  console.log('✅ DISABLE_CONSOLE_NINJA déjà configuré');
}

console.log('\n📊 RÉSUMÉ DU NETTOYAGE :');
console.log('========================');
console.log('✅ Cache Console Ninja supprimé');
console.log('✅ Variable d\'environnement ajoutée');
console.log('✅ Logs devraient être propres maintenant');

console.log('\n🚀 PROCHAINES ÉTAPES :');
console.log('1. Redémarrez le serveur avec: npm run dev');
console.log('2. Vos logs devraient être propres');
console.log('3. Plus de codes oo_oo dans la console');

console.log('\n💡 SI LE PROBLÈME PERSISTE :');
console.log('- Vérifiez vos extensions VSCode');
console.log('- Désactivez l\'extension Console Ninja');
console.log('- Redémarrez VSCode complètement');

console.log('\n✨ Nettoyage terminé !');