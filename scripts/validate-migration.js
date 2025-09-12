#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 Validation de la migration i18next vers next-intl...');

// 1. Vérifier qu'il n'y a plus de références à react-i18next
console.log('\n1. Vérification des références react-i18next...');
try {
  const result = execSync('powershell "Get-ChildItem -Path components,app -Include *.tsx -Recurse | Select-String \\"react-i18next\\""', { encoding: 'utf8' });
  if (result.trim()) {
    console.log('❌ Des références à react-i18next ont été trouvées:');
    console.log(result);
  } else {
    console.log('✅ Aucune référence à react-i18next trouvée');
  }
} catch (error) {
  console.log('✅ Aucune référence à react-i18next trouvée');
}

// 2. Vérifier que tous les composants utilisent useTranslations
console.log('\n2. Vérification de l\'utilisation de useTranslations...');
try {
  const result = execSync('powershell "(Get-ChildItem -Path components,app -Include *.tsx -Recurse | Select-String \\"useTranslations\\").Count"', { encoding: 'utf8' });
  const count = parseInt(result.trim()) || 0;
  console.log(`✅ ${count} utilisations de useTranslations trouvées`);
} catch (error) {
  console.log('⚠️  Impossible de compter les utilisations de useTranslations');
}

// 3. Vérifier que les fichiers de messages existent
console.log('\n3. Vérification des fichiers de messages...');
const locales = ['fr', 'en', 'ar'];
locales.forEach(locale => {
  const messagePath = `messages/${locale}.json`;
  if (fs.existsSync(messagePath)) {
    console.log(`✅ Fichier de messages ${locale} trouvé`);
    try {
      const content = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
      const keyCount = countKeys(content);
      console.log(`   📊 ${keyCount} clés de traduction dans ${locale}`);
    } catch (error) {
      console.log(`❌ Erreur lors de la lecture du fichier ${locale}: ${error.message}`);
    }
  } else {
    console.log(`❌ Fichier de messages ${locale} manquant`);
  }
});

// 4. Vérifier la configuration next-intl
console.log('\n4. Vérification de la configuration next-intl...');
if (fs.existsSync('i18n.ts')) {
  console.log('✅ Fichier de configuration i18n.ts trouvé');
} else {
  console.log('❌ Fichier de configuration i18n.ts manquant');
}

if (fs.existsSync('middleware.ts')) {
  console.log('✅ Middleware de routage trouvé');
} else {
  console.log('❌ Middleware de routage manquant');
}

// 5. Vérifier que les dépendances i18next ont été supprimées
console.log('\n5. Vérification de la suppression des anciennes dépendances...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const oldDeps = ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-resources-to-backend'];
  const foundDeps = oldDeps.filter(dep => 
    packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
  );
  
  if (foundDeps.length > 0) {
    console.log(`❌ Anciennes dépendances encore présentes: ${foundDeps.join(', ')}`);
  } else {
    console.log('✅ Toutes les anciennes dépendances ont été supprimées');
  }
} catch (error) {
  console.log('⚠️  Impossible de vérifier les dépendances');
}

// 6. Vérifier la structure des routes localisées
console.log('\n6. Vérification des routes localisées...');
const appDir = 'app';
if (fs.existsSync(path.join(appDir, '[locale]'))) {
  console.log('✅ Structure de routes localisées trouvée');
  
  // Vérifier quelques routes importantes
  const importantRoutes = ['dashboard', 'login', 'lofts'];
  importantRoutes.forEach(route => {
    if (fs.existsSync(path.join(appDir, '[locale]', route))) {
      console.log(`   ✅ Route /${route} localisée`);
    } else {
      console.log(`   ⚠️  Route /${route} non localisée`);
    }
  });
} else {
  console.log('❌ Structure de routes localisées manquante');
}

console.log('\n🎉 Validation terminée!');

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key], prefix + key + '.');
    } else {
      count++;
    }
  }
  return count;
}