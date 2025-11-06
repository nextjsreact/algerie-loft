#!/usr/bin/env node

/**
 * Script pour tester les traductions de la page loft
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Test des traductions de la page loft...\n');

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

// Clés utilisées dans la page loft
const requiredKeys = [
  'lofts.editLoft',
  'lofts.linkToAirbnb',
  'lofts.loftInfoTitle',
  'lofts.pricePerNight',
  'lofts.owner',
  'lofts.description',
  'lofts.available',
  'lofts.occupied',
  'lofts.maintenance',
  'lofts.details.title',
  'lofts.details.auditHistory',
  'lofts.details.owner',
  'common.currencies.da',
  'common.company',
  'owners.ownershipType',
  'lofts.additionalInfo.percentages',
  'lofts.additionalInfo.title',
  'lofts.additionalInfo.photoGallery',
  'lofts.additionalInfo.createdOn',
  'lofts.additionalInfo.lastUpdated',
  'lofts.billManagement.title',
  'lofts.billManagement.water',
  'lofts.billManagement.electricity',
  'lofts.billManagement.gas',
  'lofts.billManagement.phone',
  'lofts.billManagement.internet',
  'lofts.billManagement.nextBills',
  'lofts.billManagement.notSet',
  'lofts.billManagement.customerCode',
  'lofts.billManagement.meterNumber',
  'lofts.billManagement.correspondent',
  'lofts.billManagement.clientNumber',
  'lofts.billManagement.pdlRef'
];

// Fonction pour obtenir une valeur imbriquée
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Vérifier chaque clé
let allGood = true;
const results = { fr: [], en: [], ar: [] };

console.log('📋 Vérification des clés requises:\n');

requiredKeys.forEach(key => {
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
    console.log(`   - FR: "${frValue}"`);
    console.log(`   - EN: "${enValue}"`);
    console.log(`   - AR: "${arValue}"`);
  }
  console.log('');
  
  results.fr.push({ key, value: frValue, exists: status.fr });
  results.en.push({ key, value: enValue, exists: status.en });
  results.ar.push({ key, value: arValue, exists: status.ar });
});

console.log('\n📊 Résumé:');
console.log(`FR: ${results.fr.filter(r => r.exists).length}/${requiredKeys.length} clés présentes`);
console.log(`EN: ${results.en.filter(r => r.exists).length}/${requiredKeys.length} clés présentes`);
console.log(`AR: ${results.ar.filter(r => r.exists).length}/${requiredKeys.length} clés présentes`);

if (allGood) {
  console.log('\n🎉 Toutes les traductions requises sont présentes !');
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Redémarrer l\'application (npm run dev)');
  console.log('   2. Tester la page loft dans le navigateur');
  console.log('   3. Vérifier que les langues ne se mélangent plus');
} else {
  console.log('\n⚠️  Certaines traductions sont manquantes.');
  console.log('   Utilisez le script de correction pour les ajouter.');
}

// Sauvegarder le rapport
const reportPath = path.join(__dirname, '..', 'loft-page-translation-test.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  requiredKeys,
  results,
  summary: {
    fr: results.fr.filter(r => r.exists).length,
    en: results.en.filter(r => r.exists).length,
    ar: results.ar.filter(r => r.exists).length,
    total: requiredKeys.length,
    allPresent: allGood
  }
}, null, 2));

console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);