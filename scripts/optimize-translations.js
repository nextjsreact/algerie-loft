#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 Optimisation des fichiers de traduction...');

const locales = ['fr', 'en', 'ar'];
const messagesDir = 'messages';

// 1. Analyser la taille des fichiers avant optimisation
console.log('\n1. Analyse des tailles avant optimisation...');
const beforeSizes = {};

locales.forEach(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    beforeSizes[locale] = stats.size;
    console.log(`   ${locale}.json: ${(stats.size / 1024).toFixed(2)} KB`);
  }
});

// 2. Optimiser les fichiers de traduction
console.log('\n2. Optimisation des fichiers...');

function optimizeTranslations(messages) {
  // Supprimer les clés vides ou nulles
  function removeEmptyKeys(obj) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedNested = removeEmptyKeys(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }

  // Trier les clés alphabétiquement pour une meilleure compression
  function sortKeys(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }
    
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortKeys(obj[key]);
    });
    return sorted;
  }

  let optimized = removeEmptyKeys(messages);
  optimized = sortKeys(optimized);
  
  return optimized;
}

// Optimiser chaque fichier de langue
locales.forEach(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const messages = JSON.parse(content);
      
      const optimized = optimizeTranslations(messages);
      
      // Sauvegarder avec une indentation minimale pour réduire la taille
      const optimizedContent = JSON.stringify(optimized, null, 2);
      fs.writeFileSync(filePath, optimizedContent);
      
      console.log(`   ✅ ${locale}.json optimisé`);
    } catch (error) {
      console.log(`   ❌ Erreur lors de l'optimisation de ${locale}.json:`, error.message);
    }
  }
});

// 3. Analyser la taille après optimisation
console.log('\n3. Analyse des tailles après optimisation...');
const afterSizes = {};
let totalSavings = 0;

locales.forEach(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    afterSizes[locale] = stats.size;
    const savings = beforeSizes[locale] - afterSizes[locale];
    totalSavings += savings;
    
    console.log(`   ${locale}.json: ${(stats.size / 1024).toFixed(2)} KB (économie: ${(savings / 1024).toFixed(2)} KB)`);
  }
});

console.log(`\n📊 Économie totale: ${(totalSavings / 1024).toFixed(2)} KB`);

// 4. Créer des fichiers de traduction par namespace pour le lazy loading
console.log('\n4. Création des fichiers par namespace...');

const namespaces = ['common', 'auth', 'dashboard', 'lofts', 'transactions', 'navigation', 'forms'];

// Créer le dossier pour les namespaces
const namespacesDir = path.join(messagesDir, 'namespaces');
if (!fs.existsSync(namespacesDir)) {
  fs.mkdirSync(namespacesDir, { recursive: true });
}

locales.forEach(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const messages = JSON.parse(content);
      
      // Créer un fichier pour chaque namespace
      namespaces.forEach(namespace => {
        if (messages[namespace]) {
          const namespaceDir = path.join(namespacesDir, namespace);
          if (!fs.existsSync(namespaceDir)) {
            fs.mkdirSync(namespaceDir, { recursive: true });
          }
          
          const namespaceFile = path.join(namespaceDir, `${locale}.json`);
          fs.writeFileSync(namespaceFile, JSON.stringify(messages[namespace], null, 2));
        }
      });
      
      console.log(`   ✅ Namespaces créés pour ${locale}`);
    } catch (error) {
      console.log(`   ❌ Erreur lors de la création des namespaces pour ${locale}:`, error.message);
    }
  }
});

// 5. Générer un index des traductions pour le développement
console.log('\n5. Génération de l\'index des traductions...');

const translationIndex = {
  locales,
  namespaces,
  stats: {
    beforeOptimization: beforeSizes,
    afterOptimization: afterSizes,
    totalSavings: totalSavings
  },
  lastOptimized: new Date().toISOString()
};

fs.writeFileSync(
  path.join(messagesDir, 'index.json'), 
  JSON.stringify(translationIndex, null, 2)
);

console.log('   ✅ Index des traductions généré');

console.log('\n🎉 Optimisation terminée!');
console.log('\n💡 Prochaines étapes:');
console.log('   1. Tester le chargement des traductions optimisées');
console.log('   2. Vérifier que toutes les clés sont accessibles');
console.log('   3. Mesurer l\'impact sur les performances');