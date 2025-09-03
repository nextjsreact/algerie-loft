// Script de test des traductions
const fs = require('fs');
const path = require('path');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

console.log('🔍 Test des traductions...\n');

// Vérifier si les sections settings existent
const languages = ['en', 'fr', 'ar'];

languages.forEach(lang => {
  console.log(`📝 Langue: ${lang.toUpperCase()}`);
  
  // Vérifier si la section settings existe
  const settingsRegex = new RegExp(`${lang}:[\\s\\S]*?settings:\\s*\\{`, 'g');
  const hasSettings = settingsRegex.test(content);
  
  console.log(`   Settings section: ${hasSettings ? '✅' : '❌'}`);
  
  // Vérifier les sous-sections
  if (hasSettings) {
    const subsections = ['categories', 'currencies', 'paymentMethods', 'zoneAreas'];
    subsections.forEach(subsection => {
      const subsectionRegex = new RegExp(`${lang}:[\\s\\S]*?settings:[\\s\\S]*?${subsection}:\\s*\\{`, 'g');
      const hasSubsection = subsectionRegex.test(content);
      console.log(`   settings.${subsection}: ${hasSubsection ? '✅' : '❌'}`);
    });
  }
  
  console.log('');
});

console.log('✅ Test terminé !');