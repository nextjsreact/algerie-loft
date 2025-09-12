#!/usr/bin/env node

/**
 * Script de validation de la migration des composants de navigation
 * Vérifie que les traductions next-intl sont correctement utilisées
 */

import fs from 'fs';
import path from 'path';

// Fichiers à valider
const filesToValidate = [
  'components/layout/sidebar-nextintl.tsx',
  'components/layout/header-nextintl.tsx',
  'components/layout/enhanced-sidebar-nextintl.tsx'
];

// Patterns à vérifier
const patterns = {
  nextIntlImport: /import.*useTranslations.*from.*next-intl/,
  i18nextImport: /import.*useTranslation.*from.*react-i18next/,
  nextIntlUsage: /useTranslations\(/,
  i18nextUsage: /useTranslation\(/,
  translationCall: /t\(/
};

console.log('🔍 Validation de la migration des composants de navigation...\n');

let allValid = true;

filesToValidate.forEach(filePath => {
  console.log(`📁 Validation de ${filePath}:`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ Fichier non trouvé: ${filePath}`);
    allValid = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier l'import next-intl
  if (patterns.nextIntlImport.test(content)) {
    console.log('  ✅ Import next-intl trouvé');
  } else {
    console.log('  ❌ Import next-intl manquant');
    allValid = false;
  }
  
  // Vérifier l'absence d'import i18next
  if (!patterns.i18nextImport.test(content)) {
    console.log('  ✅ Aucun import i18next trouvé');
  } else {
    console.log('  ⚠️  Import i18next encore présent');
    allValid = false;
  }
  
  // Vérifier l'utilisation de useTranslations
  if (patterns.nextIntlUsage.test(content)) {
    console.log('  ✅ Utilisation de useTranslations trouvée');
  } else {
    console.log('  ❌ Utilisation de useTranslations manquante');
    allValid = false;
  }
  
  // Vérifier l'absence d'utilisation de useTranslation (i18next)
  if (!patterns.i18nextUsage.test(content)) {
    console.log('  ✅ Aucune utilisation de useTranslation (i18next) trouvée');
  } else {
    console.log('  ⚠️  Utilisation de useTranslation (i18next) encore présente');
    allValid = false;
  }
  
  // Compter les appels de traduction
  const translationCalls = (content.match(/t\(/g) || []).length;
  console.log(`  📊 ${translationCalls} appels de traduction trouvés`);
  
  console.log('');
});

// Vérifier la structure des traductions
console.log('📋 Vérification de la structure des traductions:');

const messagesPath = 'messages/fr.json';
if (fs.existsSync(messagesPath)) {
  try {
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    
    // Vérifier les clés de navigation
    const navKeys = [
      'nav.dashboard',
      'nav.conversations', 
      'nav.lofts',
      'nav.settings',
      'nav.loftManager'
    ];
    
    navKeys.forEach(key => {
      const keyParts = key.split('.');
      let current = messages;
      let found = true;
      
      for (const part of keyParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          found = false;
          break;
        }
      }
      
      if (found) {
        console.log(`  ✅ Clé ${key} trouvée: "${current}"`);
      } else {
        console.log(`  ❌ Clé ${key} manquante`);
        allValid = false;
      }
    });
  } catch (error) {
    console.log(`  ❌ Erreur lors de la lecture de ${messagesPath}: ${error.message}`);
    allValid = false;
  }
} else {
  console.log(`  ❌ Fichier de messages non trouvé: ${messagesPath}`);
  allValid = false;
}

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('🎉 Validation réussie ! Les composants de navigation sont correctement migrés.');
  process.exit(0);
} else {
  console.log('❌ Validation échouée. Certains problèmes doivent être corrigés.');
  process.exit(1);
}