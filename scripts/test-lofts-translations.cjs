const fs = require('fs');
const path = require('path');

console.log('🧪 TEST DES TRADUCTIONS LOFTS\n');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

// Clés à tester
const keysToTest = [
  'lofts.filterByStatus',
  'lofts.allStatuses', 
  'lofts.filterByOwner',
  'lofts.allOwners',
  'lofts.filterByZoneArea',
  'lofts.allZoneAreas',
  'lofts.noLoftsMatch',
  'lofts.couldNotLoadData',
  'lofts.unknown'
];

const languages = ['en', 'fr', 'ar'];
const expectedTranslations = {
  'lofts.filterByStatus': {
    en: 'Filter by Status',
    fr: 'Filtrer par Statut', 
    ar: 'تصفية حسب الحالة'
  },
  'lofts.allStatuses': {
    en: 'All Statuses',
    fr: 'Tous les Statuts',
    ar: 'جميع الحالات'
  },
  'lofts.filterByOwner': {
    en: 'Filter by Owner',
    fr: 'Filtrer par Propriétaire',
    ar: 'تصفية حسب المالك'
  },
  'lofts.allOwners': {
    en: 'All Owners',
    fr: 'Tous les Propriétaires', 
    ar: 'جميع الملاك'
  },
  'lofts.filterByZoneArea': {
    en: 'Filter by Zone Area',
    fr: 'Filtrer par Zone',
    ar: 'تصفية حسب المنطقة'
  },
  'lofts.allZoneAreas': {
    en: 'All Zone Areas',
    fr: 'Toutes les Zones',
    ar: 'جميع المناطق'
  }
};

console.log('🔍 Vérification des traductions ajoutées...\n');

let allFound = true;
let totalChecked = 0;
let totalFound = 0;

keysToTest.forEach(key => {
  const subKey = key.split('.')[1];
  console.log(`📋 Test de la clé: ${key}`);
  
  languages.forEach(lang => {
    totalChecked++;
    const pattern = new RegExp(`${subKey}:\\s*["'][^"']*["']`);
    const langSection = new RegExp(`${lang}:[\\s\\S]*?lofts:[\\s\\S]*?${subKey}:`);
    
    if (langSection.test(content)) {
      console.log(`  ✅ ${lang.toUpperCase()}: Trouvé`);
      totalFound++;
    } else {
      console.log(`  ❌ ${lang.toUpperCase()}: Manquant`);
      allFound = false;
    }
  });
  console.log('');
});

console.log('📊 RÉSULTATS:');
console.log(`- Clés testées: ${keysToTest.length}`);
console.log(`- Langues testées: ${languages.length}`);
console.log(`- Total vérifications: ${totalChecked}`);
console.log(`- Traductions trouvées: ${totalFound}`);
console.log(`- Taux de réussite: ${Math.round((totalFound/totalChecked)*100)}%`);

if (allFound) {
  console.log('\n🎉 SUCCÈS! Toutes les traductions lofts sont présentes!');
} else {
  console.log('\n⚠️  Certaines traductions sont manquantes.');
}

// Test spécifique pour les traductions problématiques mentionnées
console.log('\n🎯 TEST SPÉCIFIQUE POUR LES PROBLÈMES MENTIONNÉS:');
console.log('Recherche de: "lofts.filterByStatus" et "lofts.allStatuses"');

if (content.includes('filterByStatus:') && content.includes('allStatuses:')) {
  console.log('✅ Les clés problématiques ont été ajoutées!');
} else {
  console.log('❌ Les clés problématiques sont toujours manquantes.');
}

console.log('\n🏁 Test terminé!');