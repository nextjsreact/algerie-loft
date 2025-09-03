// Script de test des traductions
const fs = require('fs');
const path = require('path');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

console.log('🔍 Test des traductions...\n');

// Vérifier si les sections settings existent
const languages = ['en', 'fr', 'ar'];
const sections = ['settings.categories.subtitle', 'settings.currencies.subtitle', 'settings.paymentMethods.subtitle'];

languages.forEach(lang => {
  console.log(`📝 Langue: ${lang.toUpperCase()}`);
  
  // Vérifier si la section settings existe
  const settingsRegex = new RegExp(`${lang}:[\\s\\S]*?settings:\\s*\\{`, 'g');
  const hasSettings = settingsRegex.test(content);
  
  console.log(`   Settings section: ${hasSettings ? '✅' : '❌'}`);
  
  if (hasSettings) {
    sections.forEach(section => {
      const key = section.replace('settings.', '');
      const keyRegex = new RegExp(`${lang}:[\\s\\S]*?settings:[\\s\\S]*?${key.replace('.', ':[\\s\\S]*?')}`, 'g');
      const hasKey = keyRegex.test(content);
      console.log(`   ${section}: ${hasKey ? '✅' : '❌'}`);
    });
  }
  
  console.log('');
});

console.log('✅ Test terminé !');