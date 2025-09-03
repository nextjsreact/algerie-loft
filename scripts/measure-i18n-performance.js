#!/usr/bin/env node

import fs from 'fs';
import { performance } from 'perf_hooks';

console.log('📊 Mesure des performances i18n...');

const locales = ['fr', 'en', 'ar'];

// 1. Mesurer le temps de chargement des traductions
console.log('\n1. Test de chargement des traductions...');

async function measureLoadTime(locale) {
  const start = performance.now();
  
  try {
    const messages = JSON.parse(fs.readFileSync(`messages/${locale}.json`, 'utf8'));
    const end = performance.now();
    
    const keyCount = countKeys(messages);
    const fileSize = fs.statSync(`messages/${locale}.json`).size;
    
    return {
      locale,
      loadTime: end - start,
      keyCount,
      fileSizeKB: fileSize / 1024,
      keysPerMs: keyCount / (end - start)
    };
  } catch (error) {
    return {
      locale,
      error: error.message
    };
  }
}

const loadResults = [];
for (const locale of locales) {
  const result = await measureLoadTime(locale);
  loadResults.push(result);
  
  if (result.error) {
    console.log(`   ❌ ${locale}: ${result.error}`);
  } else {
    console.log(`   ✅ ${locale}: ${result.loadTime.toFixed(2)}ms (${result.keyCount} clés, ${result.fileSizeKB.toFixed(2)} KB)`);
  }
}

// 2. Mesurer la performance de recherche de clés
console.log('\n2. Test de performance de recherche...');

function measureKeyLookup(messages, keys) {
  const start = performance.now();
  
  keys.forEach(key => {
    getNestedValue(messages, key);
  });
  
  const end = performance.now();
  return end - start;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Clés de test communes
const testKeys = [
  'common.save',
  'common.cancel',
  'auth.login',
  'dashboard.title',
  'lofts.add',
  'transactions.list',
  'navigation.dashboard'
];

locales.forEach(locale => {
  try {
    const messages = JSON.parse(fs.readFileSync(`messages/${locale}.json`, 'utf8'));
    const lookupTime = measureKeyLookup(messages, testKeys);
    console.log(`   ${locale}: ${lookupTime.toFixed(2)}ms pour ${testKeys.length} recherches`);
  } catch (error) {
    console.log(`   ❌ ${locale}: Erreur lors du test de recherche`);
  }
});

// 3. Analyser la structure des traductions
console.log('\n3. Analyse de la structure...');

function analyzeStructure(messages) {
  const analysis = {
    totalKeys: countKeys(messages),
    maxDepth: getMaxDepth(messages),
    namespaces: Object.keys(messages).length,
    averageStringLength: getAverageStringLength(messages)
  };
  
  return analysis;
}

function getMaxDepth(obj, currentDepth = 0) {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }
  
  let maxDepth = currentDepth;
  for (const value of Object.values(obj)) {
    const depth = getMaxDepth(value, currentDepth + 1);
    maxDepth = Math.max(maxDepth, depth);
  }
  
  return maxDepth;
}

function getAverageStringLength(obj) {
  const strings = [];
  
  function collectStrings(current) {
    if (typeof current === 'string') {
      strings.push(current.length);
    } else if (typeof current === 'object' && current !== null) {
      Object.values(current).forEach(collectStrings);
    }
  }
  
  collectStrings(obj);
  return strings.length > 0 ? strings.reduce((a, b) => a + b, 0) / strings.length : 0;
}

locales.forEach(locale => {
  try {
    const messages = JSON.parse(fs.readFileSync(`messages/${locale}.json`, 'utf8'));
    const analysis = analyzeStructure(messages);
    
    console.log(`   ${locale}:`);
    console.log(`     - ${analysis.totalKeys} clés totales`);
    console.log(`     - ${analysis.namespaces} namespaces`);
    console.log(`     - Profondeur max: ${analysis.maxDepth}`);
    console.log(`     - Longueur moyenne des chaînes: ${analysis.averageStringLength.toFixed(1)} caractères`);
  } catch (error) {
    console.log(`   ❌ ${locale}: Erreur lors de l'analyse`);
  }
});

// 4. Recommandations d'optimisation
console.log('\n4. Recommandations d\'optimisation...');

const recommendations = [];

// Analyser la taille des fichiers
const avgFileSize = loadResults
  .filter(r => !r.error)
  .reduce((sum, r) => sum + r.fileSizeKB, 0) / loadResults.filter(r => !r.error).length;

if (avgFileSize > 100) {
  recommendations.push('📦 Considérer la division des traductions en chunks plus petits');
}

// Analyser le temps de chargement
const avgLoadTime = loadResults
  .filter(r => !r.error)
  .reduce((sum, r) => sum + r.loadTime, 0) / loadResults.filter(r => !r.error).length;

if (avgLoadTime > 10) {
  recommendations.push('⚡ Implémenter le cache des traductions côté client');
}

// Recommandations générales
recommendations.push('🔧 Utiliser le lazy loading pour les namespaces non critiques');
recommendations.push('🗜️ Activer la compression gzip pour les fichiers de traduction');
recommendations.push('📱 Implémenter le préchargement intelligent basé sur la navigation');

recommendations.forEach(rec => console.log(`   ${rec}`));

// 5. Générer un rapport de performance
const performanceReport = {
  timestamp: new Date().toISOString(),
  loadResults,
  averages: {
    fileSize: avgFileSize,
    loadTime: avgLoadTime
  },
  recommendations,
  testConfiguration: {
    locales,
    testKeys
  }
};

fs.writeFileSync('i18n-performance-report.json', JSON.stringify(performanceReport, null, 2));

console.log('\n📋 Rapport de performance sauvegardé: i18n-performance-report.json');
console.log('\n🎉 Mesure des performances terminée!');

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}