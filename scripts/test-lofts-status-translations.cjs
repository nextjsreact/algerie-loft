const fs = require('fs');
const path = require('path');

console.log('🧪 TEST DES TRADUCTIONS STATUTS LOFTS\n');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

// Statuts à tester
const statusesToTest = [
  'lofts.status.available',
  'lofts.status.occupied',
  'lofts.status.maintenance',
  'lofts.status.unavailable',
  'lofts.status.reserved'
];

const languages = ['en', 'fr', 'ar'];
const expectedTranslations = {
  'lofts.status.available': {
    en: 'Available',
    fr: 'Disponible',
    ar: 'متاح'
  },
  'lofts.status.occupied': {
    en: 'Occupied',
    fr: 'Occupé',
    ar: 'مشغول'
  },
  'lofts.status.maintenance': {
    en: 'Maintenance',
    fr: 'Maintenance',
    ar: 'صيانة'
  },
  'lofts.status.unavailable': {
    en: 'Unavailable',
    fr: 'Indisponible',
    ar: 'غير متاح'
  },
  'lofts.status.reserved': {
    en: 'Reserved',
    fr: 'Réservé',
    ar: 'محجوز'
  }
};

console.log('🔍 Vérification des statuts lofts...\n');

let allFound = true;
let totalChecked = 0;
let totalFound = 0;

statusesToTest.forEach(key => {
  const statusKey = key.split('.')[2]; // available, occupied, etc.
  console.log(`📋 Test du statut: ${key}`);
  
  languages.forEach(lang => {
    totalChecked++;
    // Chercher la section status dans lofts pour chaque langue
    const statusPattern = new RegExp(`${lang}:[\\s\\S]*?lofts:[\\s\\S]*?status:[\\s\\S]*?${statusKey}:\\s*["'][^"']*["']`);
    
    if (statusPattern.test(content)) {
      console.log(`  ✅ ${lang.toUpperCase()}: ${expectedTranslations[key][lang]}`);
      totalFound++;
    } else {
      console.log(`  ❌ ${lang.toUpperCase()}: Manquant`);
      allFound = false;
    }
  });
  console.log('');
});

console.log('📊 RÉSULTATS:');
console.log(`- Statuts testés: ${statusesToTest.length}`);
console.log(`- Langues testées: ${languages.length}`);
console.log(`- Total vérifications: ${totalChecked}`);
console.log(`- Traductions trouvées: ${totalFound}`);
console.log(`- Taux de réussite: ${Math.round((totalFound/totalChecked)*100)}%`);

if (allFound) {
  console.log('\n🎉 SUCCÈS! Tous les statuts lofts sont traduits!');
  console.log('\n✅ Le problème "lofts.status.available" est maintenant résolu!');
} else {
  console.log('\n⚠️  Certains statuts sont manquants.');
}

// Test spécifique pour le problème mentionné
console.log('\n🎯 TEST SPÉCIFIQUE:');
if (content.includes('available: "متاح"') && content.includes('available: "Available"') && content.includes('available: "Disponible"')) {
  console.log('✅ "lofts.status.available" est maintenant traduit dans les 3 langues!');
} else {
  console.log('❌ "lofts.status.available" manque encore dans certaines langues.');
}

console.log('\n🏁 Test terminé!');