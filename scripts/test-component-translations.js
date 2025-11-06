#!/usr/bin/env node

/**
 * Script pour tester les traductions des composants de la page loft
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Test des traductions des composants...\n');

// Charger les fichiers de traduction
const loadTranslations = (locale) => {
  const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${locale}.json:`, error.message);
    return {};
  }
};

const fr = loadTranslations('fr');
const en = loadTranslations('en');
const ar = loadTranslations('ar');

// Clés utilisées par LoftBillManagement
const billManagementKeys = [
  'lofts.quarterly',
  'lofts.monthly',
  'lofts.yearly',
  'lofts.weekly',
  'lofts.bimonthly',
  'lofts.fourMonthly',
  'lofts.billManagement.frequency',
  'lofts.billManagement.noFrequencySet',
  'lofts.billManagement.daysOverdue',
  'lofts.billManagement.dueToday',
  'lofts.billManagement.dueTomorrow',
  'lofts.billManagement.dueInDays',
  'lofts.billManagement.due',
  'lofts.billManagement.pleaseEnterPaymentAmount',
  'lofts.billManagement.markAsPaid',
  'lofts.billManagement.noBillDueDatesSet',
  'lofts.billManagement.editLoftToAddBillInfo',
  'lofts.billManagement.markBillAsPaid',
  'lofts.billManagement.paymentAmount',
  'lofts.billManagement.enterPaymentAmount',
  'lofts.billManagement.processing',
  'lofts.billManagement.nextDueDateAutoCalculated',
  'lofts.billManagement.currentDueDate'
];

// Clés utilisées par LoftPhotoGallery
const photoGalleryKeys = [
  'lofts.photos.loadError',
  'lofts.photos.photoDownloaded',
  'lofts.photos.noPhotos',
  'lofts.photos.noPhotosDescription',
  'lofts.photos.mainPhoto',
  'lofts.photos.photoViewer',
  'lofts.photos.photoGallery',
  'lofts.photos.photosAvailable'
];

const allKeys = [...billManagementKeys, ...photoGalleryKeys];

// Fonction pour obtenir une valeur imbriquée
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Vérifier chaque clé
let allGood = true;
const results = { fr: [], en: [], ar: [] };

console.log('📋 Vérification des clés des composants:\n');

console.log('🔧 LoftBillManagement:');
billManagementKeys.forEach(key => {
  const frValue = getNestedValue(fr, key);
  const enValue = getNestedValue(en, key);
  const arValue = getNestedValue(ar, key);
  
  const status = {
    fr: frValue !== undefined,
    en: enValue !== undefined,
    ar: arValue !== undefined
  };
  
  if (!status.fr || !status.en || !status.ar) {
    allGood = false;
    console.log(`❌ ${key}`);
    if (!status.fr) console.log(`   - FR: manquant`);
    if (!status.en) console.log(`   - EN: manquant`);
    if (!status.ar) console.log(`   - AR: manquant`);
  } else {
    console.log(`✅ ${key}`);
  }
});

console.log('\n📸 LoftPhotoGallery:');
photoGalleryKeys.forEach(key => {
  const frValue = getNestedValue(fr, key);
  const enValue = getNestedValue(en, key);
  const arValue = getNestedValue(ar, key);
  
  const status = {
    fr: frValue !== undefined,
    en: enValue !== undefined,
    ar: arValue !== undefined
  };
  
  if (!status.fr || !status.en || !status.ar) {
    allGood = false;
    console.log(`❌ ${key}`);
    if (!status.fr) console.log(`   - FR: manquant`);
    if (!status.en) console.log(`   - EN: manquant`);
    if (!status.ar) console.log(`   - AR: manquant`);
  } else {
    console.log(`✅ ${key}`);
  }
});

console.log('\n📊 Résumé:');
const frCount = allKeys.filter(key => getNestedValue(fr, key) !== undefined).length;
const enCount = allKeys.filter(key => getNestedValue(en, key) !== undefined).length;
const arCount = allKeys.filter(key => getNestedValue(ar, key) !== undefined).length;

console.log(`FR: ${frCount}/${allKeys.length} clés présentes`);
console.log(`EN: ${enCount}/${allKeys.length} clés présentes`);
console.log(`AR: ${arCount}/${allKeys.length} clés présentes`);

if (allGood) {
  console.log('\n🎉 Toutes les traductions des composants sont présentes !');
  console.log('\n💡 La page loft devrait maintenant afficher correctement dans toutes les langues.');
} else {
  console.log('\n⚠️  Certaines traductions de composants sont manquantes.');
  console.log('   Cela peut causer le mélange de langues que vous observez.');
}

console.log('\n🚀 Prochaines étapes:');
console.log('   1. Redémarrer l\'application (npm run dev)');
console.log('   2. Tester la page loft en français, anglais et arabe');
console.log('   3. Vérifier que tous les textes sont dans la bonne langue');