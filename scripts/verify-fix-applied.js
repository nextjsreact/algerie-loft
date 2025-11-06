#!/usr/bin/env node

/**
 * Script pour vérifier que les corrections sont bien appliquées
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 VÉRIFICATION DES CORRECTIONS APPLIQUÉES\n');

// Vérifier les fichiers créés
const filesToCheck = [
  'app/nuclear-spacing-fix.css',
  'app/emergency-fix.css',
  'components/nuclear-spacing-fix.tsx'
];

console.log('📁 Vérification des fichiers:');
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
  } else {
    console.log(`❌ ${file} - MANQUANT !`);
  }
});

// Vérifier globals.css
console.log('\n📄 Vérification de globals.css:');
const globalsPath = path.join(__dirname, '..', 'app', 'globals.css');
if (fs.existsSync(globalsPath)) {
  const content = fs.readFileSync(globalsPath, 'utf8');
  
  if (content.includes('emergency-fix.css')) {
    console.log('✅ emergency-fix.css importé');
  } else {
    console.log('❌ emergency-fix.css NON importé');
  }
  
  if (content.includes('nuclear-spacing-fix.css')) {
    console.log('✅ nuclear-spacing-fix.css importé');
  } else {
    console.log('❌ nuclear-spacing-fix.css NON importé');
  }
} else {
  console.log('❌ globals.css non trouvé');
}

// Vérifier layout.tsx
console.log('\n📄 Vérification du layout:');
const layoutPath = path.join(__dirname, '..', 'app', '[locale]', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  const content = fs.readFileSync(layoutPath, 'utf8');
  
  if (content.includes('NuclearSpacingFix')) {
    console.log('✅ NuclearSpacingFix importé et utilisé');
  } else {
    console.log('❌ NuclearSpacingFix NON utilisé');
  }
} else {
  console.log('❌ layout.tsx non trouvé');
}

console.log('\n🚀 INSTRUCTIONS:');
console.log('1. Redémarrez votre application: npm run dev');
console.log('2. Ouvrez votre navigateur');
console.log('3. Cherchez le badge rouge "🚨 EMERGENCY FIX ACTIF 🚨" en haut à gauche');
console.log('4. Si vous le voyez, la correction est active !');

console.log('\n💡 SI VOUS NE VOYEZ PAS LE BADGE:');
console.log('- Vérifiez la console du navigateur (F12)');
console.log('- Regardez s\'il y a des erreurs JavaScript');
console.log('- Essayez de rafraîchir la page (Ctrl+F5)');

console.log('\n🎯 RÉSULTAT ATTENDU:');
console.log('Les textes devraient être espacés au lieu d\'être collés ensemble');
console.log('Exemple: "مدير الشقة تبديل المظهر" au lieu de "مدير الشقةتبديل المظهر"');