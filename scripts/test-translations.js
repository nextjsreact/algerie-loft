#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script de test des traductions spécifiques
 */
console.log('🧪 Test des traductions spécifiques...\n');

const languages = ['fr', 'en', 'ar'];
const translationFiles = {};

// Charger les fichiers de traduction
languages.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    translationFiles[lang] = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${lang}.json`);
    translationFiles[lang] = {};
  }
});

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

// Tester les clés spécifiques qui causaient l'erreur
const testKeys = [
  'admin.users.roles.admin',
  'admin.users.roles.manager', 
  'admin.users.roles.executive',
  'admin.users.roles.member',
  'admin.users.roles.client',
  'admin.users.roles.partner',
  'admin.users.roles.guest'
];

console.log('🔍 Test des clés admin.users.roles.*:\n');

testKeys.forEach(key => {
  console.log(`📋 Clé: ${key}`);
  
  languages.forEach(lang => {
    const value = getTranslation(lang, key);
    if (value) {
      console.log(`  ✅ ${lang.toUpperCase()}: "${value}"`);
    } else {
      console.log(`  ❌ ${lang.toUpperCase()}: MANQUANT`);
    }
  });
  
  console.log('');
});

// Tester d'autres clés courantes
const otherTestKeys = [
  'roles.admin',
  'auth.admin', 
  'common.loading',
  'forms.save',
  'forms.cancel'
];

console.log('🔍 Test d\'autres clés courantes:\n');

otherTestKeys.forEach(key => {
  console.log(`📋 Clé: ${key}`);
  
  languages.forEach(lang => {
    const value = getTranslation(lang, key);
    if (value) {
      console.log(`  ✅ ${lang.toUpperCase()}: "${value}"`);
    } else {
      console.log(`  ❌ ${lang.toUpperCase()}: MANQUANT`);
    }
  });
  
  console.log('');
});

console.log('✨ Test terminé !');