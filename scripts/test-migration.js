#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🧪 Tests de la migration next-intl...');

// 1. Test de cohérence des clés de traduction
console.log('\n1. Test de cohérence des clés de traduction...');

const locales = ['fr', 'en', 'ar'];
const messages = {};

// Charger tous les fichiers de messages
locales.forEach(locale => {
  try {
    const content = fs.readFileSync(`messages/${locale}.json`, 'utf8');
    messages[locale] = JSON.parse(content);
    console.log(`✅ Messages ${locale} chargés`);
  } catch (error) {
    console.log(`❌ Erreur lors du chargement des messages ${locale}: ${error.message}`);
    return;
  }
});

// Fonction pour extraire toutes les clés d'un objet
function extractKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...extractKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Extraire toutes les clés pour chaque locale
const allKeys = {};
locales.forEach(locale => {
  if (messages[locale]) {
    allKeys[locale] = new Set(extractKeys(messages[locale]));
  }
});

// Vérifier la cohérence des clés
console.log('\n2. Vérification de la cohérence des clés...');
const baseLocale = 'fr';
const baseKeys = allKeys[baseLocale];

if (baseKeys) {
  locales.forEach(locale => {
    if (locale === baseLocale) return;
    
    const currentKeys = allKeys[locale];
    if (!currentKeys) return;
    
    const missingKeys = [...baseKeys].filter(key => !currentKeys.has(key));
    const extraKeys = [...currentKeys].filter(key => !baseKeys.has(key));
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`✅ ${locale}: Toutes les clés sont cohérentes`);
    } else {
      console.log(`⚠️  ${locale}: Incohérences détectées`);
      if (missingKeys.length > 0) {
        console.log(`   📝 Clés manquantes (${missingKeys.length}): ${missingKeys.slice(0, 5).join(', ')}${missingKeys.length > 5 ? '...' : ''}`);
      }
      if (extraKeys.length > 0) {
        console.log(`   📝 Clés supplémentaires (${extraKeys.length}): ${extraKeys.slice(0, 5).join(', ')}${extraKeys.length > 5 ? '...' : ''}`);
      }
    }
  });
}

// 3. Test de la structure des traductions
console.log('\n3. Test de la structure des traductions...');

const expectedSections = [
  'common',
  'auth',
  'dashboard',
  'lofts',
  'transactions',
  'navigation',
  'forms'
];

expectedSections.forEach(section => {
  const hasSection = locales.every(locale => 
    messages[locale] && messages[locale][section]
  );
  
  if (hasSection) {
    console.log(`✅ Section "${section}" présente dans toutes les langues`);
  } else {
    console.log(`❌ Section "${section}" manquante dans certaines langues`);
  }
});

// 4. Test des interpolations
console.log('\n4. Test des interpolations...');

function findInterpolations(obj, prefix = '') {
  const interpolations = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'string') {
      const matches = obj[key].match(/\{[^}]+\}/g);
      if (matches) {
        interpolations.push({
          key: fullKey,
          interpolations: matches
        });
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      interpolations.push(...findInterpolations(obj[key], fullKey));
    }
  }
  return interpolations;
}

locales.forEach(locale => {
  if (messages[locale]) {
    const interpolations = findInterpolations(messages[locale]);
    console.log(`📊 ${locale}: ${interpolations.length} traductions avec interpolations`);
  }
});

console.log('\n🎉 Tests terminés!');