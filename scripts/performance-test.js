#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('⚡ Test de performance de la migration...');

// 1. Taille des bundles
console.log('\n1. Analyse de la taille des bundles...');

try {
  // Construire l'application pour analyser les bundles
  console.log('🔨 Construction de l\'application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Analyser la taille des fichiers de traduction
  console.log('\n📊 Taille des fichiers de traduction:');
  const locales = ['fr', 'en', 'ar'];
  let totalSize = 0;
  
  locales.forEach(locale => {
    try {
      const stats = fs.statSync(`messages/${locale}.json`);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ${locale}.json: ${sizeKB} KB`);
      totalSize += stats.size;
    } catch (error) {
      console.log(`   ❌ Impossible de lire ${locale}.json`);
    }
  });
  
  console.log(`   📦 Taille totale des traductions: ${(totalSize / 1024).toFixed(2)} KB`);
  
  // Analyser le dossier .next pour les bundles
  if (fs.existsSync('.next')) {
    console.log('\n📦 Analyse des bundles Next.js...');
    try {
      const buildOutput = execSync('powershell "Get-ChildItem -Path .next -Recurse -Include *.js | Measure-Object -Property Length -Sum"', { encoding: 'utf8' });
      console.log('   Bundles JavaScript générés avec succès');
    } catch (error) {
      console.log('   ⚠️  Impossible d\'analyser les bundles');
    }
  }
  
} catch (error) {
  console.log('❌ Erreur lors de la construction:', error.message);
}

// 2. Test de chargement des traductions
console.log('\n2. Test de chargement des traductions...');

const locales = ['fr', 'en', 'ar'];
locales.forEach(locale => {
  const startTime = process.hrtime.bigint();
  
  try {
    const content = fs.readFileSync(`messages/${locale}.json`, 'utf8');
    const messages = JSON.parse(content);
    
    const endTime = process.hrtime.bigint();
    const loadTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    const keyCount = countKeys(messages);
    console.log(`   ${locale}: ${loadTime.toFixed(2)}ms pour ${keyCount} clés`);
  } catch (error) {
    console.log(`   ❌ ${locale}: Erreur de chargement`);
  }
});

// 3. Recommandations d'optimisation
console.log('\n3. Recommandations d\'optimisation...');

const recommendations = [
  '🔧 Considérer le lazy loading des traductions par route',
  '🔧 Implémenter la compression gzip pour les fichiers de traduction',
  '🔧 Utiliser le cache navigateur pour les traductions statiques',
  '🔧 Séparer les traductions communes des traductions spécifiques aux pages'
];

recommendations.forEach(rec => console.log(`   ${rec}`));

console.log('\n⚡ Test de performance terminé!');

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