// Test des traductions categories
const fs = require('fs');
const path = require('path');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

console.log('🔍 Test des traductions categories...\n');

// Clés utilisées dans les composants
const requiredKeys = [
  'common.name',
  'common.actions', 
  'common.edit',
  'common.delete',
  'settings.categories.description',
  'settings.categories.deleteConfirm',
  'transactions.type',
  'transactions.income',
  'transactions.expense'
];

const languages = ['en', 'fr', 'ar'];

languages.forEach(lang => {
  console.log(`📝 Langue: ${lang.toUpperCase()}`);
  
  requiredKeys.forEach(key => {
    const keyParts = key.split('.');
    let found = false;
    
    if (keyParts[0] === 'common') {
      // Vérifier dans la section common
      const commonRegex = new RegExp(`${lang === 'en' ? '' : lang + ':'}[\\s\\S]*?common:\\s*\\{([\\s\\S]*?)\\}`, 'g');
      const matches = [...content.matchAll(commonRegex)];
      found = matches.some(match => {
        const keyRegex = new RegExp(`${keyParts[1]}:\\s*["']`, 'g');
        return keyRegex.test(match[1]);
      });
    } else if (keyParts[0] === 'settings') {
      // Vérifier dans settings.categories
      const settingsRegex = new RegExp(`${lang === 'en' ? '' : lang + ':'}[\\s\\S]*?settings:[\\s\\S]*?categories:\\s*\\{([\\s\\S]*?)\\}`, 'g');
      const matches = [...content.matchAll(settingsRegex)];
      found = matches.some(match => {
        const keyRegex = new RegExp(`${keyParts[2]}:\\s*["']`, 'g');
        return keyRegex.test(match[1]);
      });
    } else if (keyParts[0] === 'transactions') {
      // Vérifier dans la section transactions
      const transactionsRegex = new RegExp(`${lang === 'en' ? '' : lang + ':'}[\\s\\S]*?transactions:\\s*\\{([\\s\\S]*?)\\}`, 'g');
      const matches = [...content.matchAll(transactionsRegex)];
      found = matches.some(match => {
        const keyRegex = new RegExp(`${keyParts[1]}:\\s*["']`, 'g');
        return keyRegex.test(match[1]);
      });
    }
    
    console.log(`   ${key}: ${found ? '✅' : '❌'}`);
  });
  
  console.log('');
});

console.log('✅ Test terminé !');