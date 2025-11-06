#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script de diagnostic pour les problèmes de mélange de langues
 */
console.log('🔍 Diagnostic des problèmes de mélange de langues...\n');

const languages = ['fr', 'en', 'ar'];
const translationFiles = {};

// Charger les fichiers de traduction
console.log('📂 Chargement des fichiers de traduction...');
languages.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    translationFiles[lang] = JSON.parse(content);
    console.log(`✅ ${lang}.json chargé`);
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${lang}.json:`, error.message);
    translationFiles[lang] = {};
  }
});

// Fonction pour extraire toutes les clés
function extractKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Fonction pour obtenir une valeur de traduction
function getTranslation(lang, key) {
  const keys = key.split('.');
  let current = translationFiles[lang];
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return null;
    }
  }
  
  return current;
}

// Analyser les clés manquantes par langue
console.log('\n🔍 Analyse des clés manquantes par langue...');

const allKeysPerLang = {};
languages.forEach(lang => {
  allKeysPerLang[lang] = extractKeys(translationFiles[lang]);
});

// Trouver les clés communes et manquantes
const allUniqueKeys = new Set();
Object.values(allKeysPerLang).forEach(keys => {
  keys.forEach(key => allUniqueKeys.add(key));
});

console.log(`\n📊 Total de clés uniques trouvées: ${allUniqueKeys.size}`);

const missingByLang = {};
languages.forEach(lang => {
  missingByLang[lang] = [];
  allUniqueKeys.forEach(key => {
    if (!allKeysPerLang[lang].includes(key)) {
      missingByLang[lang].push(key);
    }
  });
});

// Afficher les statistiques
console.log('\n📈 Statistiques par langue:');
languages.forEach(lang => {
  const total = allKeysPerLang[lang].length;
  const missing = missingByLang[lang].length;
  const completeness = Math.round(((total - missing) / allUniqueKeys.size) * 100);
  
  console.log(`${lang.toUpperCase()}: ${completeness}% complet (${total} clés, ${missing} manquantes)`);
});

// Identifier les clés problématiques communes
console.log('\n🚨 Clés manquantes dans plusieurs langues:');
const commonMissingKeys = [];

allUniqueKeys.forEach(key => {
  const missingInLangs = languages.filter(lang => !allKeysPerLang[lang].includes(key));
  if (missingInLangs.length > 1) {
    commonMissingKeys.push({
      key: key,
      missingIn: missingInLangs
    });
  }
});

commonMissingKeys.slice(0, 20).forEach(item => {
  console.log(`   - ${item.key} (manquant dans: ${item.missingIn.join(', ')})`);
});

if (commonMissingKeys.length > 20) {
  console.log(`   ... et ${commonMissingKeys.length - 20} autres`);
}

// Analyser les clés spécifiques mentionnées dans l'erreur
console.log('\n🔍 Analyse des clés spécifiques de l\'interface:');

const interfaceKeys = [
  'nav.dashboard',
  'nav.conversations', 
  'nav.notifications',
  'nav.lofts',
  'nav.clients',
  'nav.bookings',
  'nav.availability',
  'nav.tasks',
  'nav.teams',
  'nav.owners',
  'nav.transactions',
  'nav.reports',
  'nav.settings',
  'nav.logout',
  'lofts.details.title',
  'lofts.details.pricePerNight',
  'lofts.details.owner',
  'lofts.details.propertyType',
  'lofts.details.description',
  'lofts.details.amenities',
  'lofts.details.gallery',
  'lofts.details.additionalInfo',
  'lofts.details.createdAt',
  'lofts.details.lastUpdated',
  'bills.management.title',
  'bills.management.water',
  'bills.management.electricity',
  'bills.management.gas',
  'bills.management.phone',
  'bills.management.internet',
  'bills.frequency.notSet',
  'bills.frequency.undefined',
  'common.available',
  'common.edit',
  'common.modify'
];

interfaceKeys.forEach(key => {
  console.log(`\n📋 ${key}:`);
  languages.forEach(lang => {
    const value = getTranslation(lang, key);
    if (value) {
      console.log(`  ✅ ${lang.toUpperCase()}: "${value}"`);
    } else {
      console.log(`  ❌ ${lang.toUpperCase()}: MANQUANT`);
    }
  });
});

// Détecter les valeurs en mauvaise langue
console.log('\n🔍 Détection des valeurs en mauvaise langue...');

function detectLanguageMismatch() {
  const issues = [];
  
  // Patterns pour détecter les langues
  const patterns = {
    french: /^[a-zA-ZÀ-ÿ\s\-'.,!?()]+$/,
    english: /^[a-zA-Z\s\-'.,!?()]+$/,
    arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
  };
  
  languages.forEach(lang => {
    allKeysPerLang[lang].forEach(key => {
      const value = getTranslation(lang, key);
      if (typeof value === 'string' && value.length > 2) {
        let expectedPattern;
        
        switch(lang) {
          case 'fr':
            expectedPattern = patterns.french;
            break;
          case 'en':
            expectedPattern = patterns.english;
            break;
          case 'ar':
            expectedPattern = patterns.arabic;
            break;
        }
        
        if (lang === 'ar' && !patterns.arabic.test(value)) {
          issues.push({
            key: key,
            lang: lang,
            value: value,
            issue: 'Texte arabe attendu mais contient du latin'
          });
        } else if (lang !== 'ar' && patterns.arabic.test(value)) {
          issues.push({
            key: key,
            lang: lang,
            value: value,
            issue: 'Texte latin attendu mais contient de l\'arabe'
          });
        }
      }
    });
  });
  
  return issues;
}

const languageIssues = detectLanguageMismatch();

if (languageIssues.length > 0) {
  console.log(`\n⚠️  ${languageIssues.length} problèmes de langue détectés:`);
  languageIssues.slice(0, 10).forEach(issue => {
    console.log(`   - ${issue.key} (${issue.lang}): "${issue.value}" - ${issue.issue}`);
  });
  
  if (languageIssues.length > 10) {
    console.log(`   ... et ${languageIssues.length - 10} autres`);
  }
} else {
  console.log('\n✅ Aucun problème de mélange de langue détecté dans les fichiers de traduction');
}

// Générer un rapport de diagnostic
const diagnosticReport = {
  timestamp: new Date().toISOString(),
  totalUniqueKeys: allUniqueKeys.size,
  keysByLanguage: Object.fromEntries(
    languages.map(lang => [lang, allKeysPerLang[lang].length])
  ),
  missingByLanguage: missingByLang,
  commonMissingKeys: commonMissingKeys,
  languageIssues: languageIssues,
  completeness: Object.fromEntries(
    languages.map(lang => [
      lang, 
      Math.round(((allKeysPerLang[lang].length - missingByLang[lang].length) / allUniqueKeys.size) * 100)
    ])
  )
};

const reportPath = 'language-mixing-diagnostic-report.json';
fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));

console.log(`\n📄 Rapport de diagnostic sauvegardé: ${reportPath}`);

// Recommandations
console.log('\n💡 Recommandations:');

if (commonMissingKeys.length > 50) {
  console.log('   1. Exécuter le script de correction automatique pour ajouter les traductions manquantes');
  console.log('      → npm run translations:analyze');
}

if (languageIssues.length > 0) {
  console.log('   2. Corriger les valeurs en mauvaise langue dans les fichiers de traduction');
}

console.log('   3. Vérifier la configuration i18n et la détection de langue dans le middleware');
console.log('   4. S\'assurer que les composants utilisent les bons namespaces de traduction');

console.log('\n✨ Diagnostic terminé !');