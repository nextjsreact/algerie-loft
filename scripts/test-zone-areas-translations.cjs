// Test des traductions zoneAreas
const fs = require('fs');
const path = require('path');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

console.log('🔍 Test des traductions zoneAreas...\n');

// Clés utilisées dans les composants
const requiredKeys = [
  'name',
  'actions', 
  'existingZoneAreas',
  'noZoneAreasYet',
  'deleteConfirm',
  'deleteSuccess',
  'deleteError',
  'nameRequired',
  'updateSuccess',
  'createSuccess',
  'editZoneArea',
  'addNewZoneArea',
  'updateZoneAreaInfo',
  'createNewZoneArea',
  'zoneDetails',
  'enterZoneInfo',
  'zoneAreaName',
  'namePlaceholder',
  'updateZoneArea',
  'createZoneArea'
];

const languages = ['en', 'fr', 'ar'];

languages.forEach(lang => {
  console.log(`📝 Langue: ${lang.toUpperCase()}`);
  
  // Vérifier si la section zoneAreas existe
  const zoneAreasRegex = new RegExp(`${lang === 'en' ? '' : lang + ':'}[\\s\\S]*?zoneAreas:\\s*\\{([\\s\\S]*?)\\}`, 'g');
  const matches = [...content.matchAll(zoneAreasRegex)];
  
  if (matches.length > 0) {
    console.log(`   Sections zoneAreas trouvées: ${matches.length}`);
    
    // Vérifier chaque clé requise
    requiredKeys.forEach(key => {
      const keyRegex = new RegExp(`${key}:\\s*["']`, 'g');
      const hasKey = matches.some(match => keyRegex.test(match[1]));
      console.log(`   ${key}: ${hasKey ? '✅' : '❌'}`);
    });
  } else {
    console.log('   ❌ Aucune section zoneAreas trouvée');
  }
  
  console.log('');
});

console.log('✅ Test terminé !');

// Vérifier s'il y a des doublons
console.log('\n🔍 Vérification des doublons...');
languages.forEach(lang => {
  const zoneAreasRegex = new RegExp(`zoneAreas:\\s*\\{`, 'g');
  const matches = [...content.matchAll(zoneAreasRegex)];
  console.log(`${lang.toUpperCase()}: ${matches.length} sections zoneAreas trouvées`);
});