#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script de validation des corrections d'interface
 */
console.log('✅ Validation des corrections d\'interface...\n');

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

// Clés critiques qui causaient le mélange de langues
const criticalKeys = [
  'nav.clients',
  'nav.bookings', 
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
  'lofts.details.edit',
  'bills.management.title',
  'bills.management.water',
  'bills.management.electricity',
  'bills.management.gas',
  'bills.management.phone',
  'bills.management.internet',
  'bills.frequency.notSet',
  'bills.frequency.undefined',
  'bills.upcomingBills',
  'bills.noDueDatesSet',
  'bills.editLoftToAddFrequencies',
  'common.available',
  'common.company',
  'common.percentages',
  'common.amenityInfo',
  'ui.toggleTheme',
  'ui.userRole'
];

console.log('🔍 Vérification des clés critiques...\n');

let allPresent = true;
let totalChecked = 0;
let totalPresent = 0;

criticalKeys.forEach(key => {
  console.log(`📋 ${key}:`);
  
  languages.forEach(lang => {
    const value = getTranslation(lang, key);
    totalChecked++;
    
    if (value) {
      totalPresent++;
      console.log(`  ✅ ${lang.toUpperCase()}: "${value}"`);
    } else {
      allPresent = false;
      console.log(`  ❌ ${lang.toUpperCase()}: MANQUANT`);
    }
  });
  
  console.log('');
});

// Résumé de validation
console.log('📊 Résumé de validation:');
console.log(`   Clés vérifiées: ${totalChecked}`);
console.log(`   Clés présentes: ${totalPresent}`);
console.log(`   Taux de réussite: ${Math.round((totalPresent / totalChecked) * 100)}%`);

if (allPresent) {
  console.log('\n🎉 ✅ VALIDATION RÉUSSIE !');
  console.log('   Toutes les traductions critiques sont maintenant présentes.');
  console.log('   Le mélange de langues dans l\'interface devrait être résolu.');
} else {
  console.log('\n⚠️  ❌ VALIDATION PARTIELLE');
  console.log('   Certaines traductions sont encore manquantes.');
  console.log('   Le mélange de langues peut persister.');
}

// Vérifier les corrections de langue mixte
console.log('\n🔍 Vérification des corrections de langue mixte...');

const mixedLanguageKeys = [
  'auth.passwordReset.emailPlaceholder',
  'auth.clientRegistration.emailPlaceholder', 
  'auth.partnerRegistration.emailPlaceholder',
  'blog.comments.form.emailPlaceholder',
  'lofts.deleteConfirmationKeyword'
];

let mixedLanguageFixed = true;

mixedLanguageKeys.forEach(key => {
  const arValue = getTranslation('ar', key);
  if (arValue) {
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(arValue);
    console.log(`   ${key}: "${arValue}" ${hasArabic ? '✅' : '⚠️'}`);
    
    if (!hasArabic && !['PayPal', 'Stripe', '+213 XX XX XX XX'].includes(arValue)) {
      mixedLanguageFixed = false;
    }
  }
});

if (mixedLanguageFixed) {
  console.log('\n✅ Corrections de langue mixte appliquées avec succès');
} else {
  console.log('\n⚠️  Certaines corrections de langue mixte nécessitent encore attention');
}

// Recommandations finales
console.log('\n💡 Recommandations:');

if (allPresent && mixedLanguageFixed) {
  console.log('   ✅ Redémarrez l\'application pour voir les corrections');
  console.log('   ✅ L\'interface devrait maintenant afficher les bonnes traductions');
  console.log('   ✅ Plus de mélange français/anglais/arabe');
} else {
  console.log('   🔧 Exécutez à nouveau le script de correction si nécessaire');
  console.log('   🔍 Vérifiez la configuration des composants qui utilisent ces traductions');
  console.log('   📝 Ajoutez manuellement les traductions encore manquantes');
}

console.log('\n✨ Validation terminée !');