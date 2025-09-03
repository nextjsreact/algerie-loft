const fs = require('fs');
const path = require('path');

console.log('🎯 AJOUT DES TRADUCTIONS CRITIQUES MANQUANTES\n');

const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(translationsPath, 'utf8');

// Créer une sauvegarde
const backupPath = path.join(__dirname, `../lib/i18n/translations-backup-${Date.now()}.ts`);
fs.writeFileSync(backupPath, content);
console.log(`💾 Sauvegarde créée: ${path.basename(backupPath)}`);

// Traductions critiques à ajouter
const criticalTranslations = {
  // Common essentials
  'pickDate': { en: 'Pick a date', fr: 'Choisir une date', ar: 'اختر تاريخاً' },
  'pickDateRange': { en: 'Pick date range', fr: 'Choisir une plage de dates', ar: 'اختر نطاق التواريخ' },
  'next': { en: 'Next', fr: 'Suivant', ar: 'التالي' },
  'previous': { en: 'Previous', fr: 'Précédent', ar: 'السابق' },
  'today': { en: 'Today', fr: 'Aujourd\'hui', ar: 'اليوم' },
  'date': { en: 'Date', fr: 'Date', ar: 'التاريخ' },
  'time': { en: 'Time', fr: 'Heure', ar: 'الوقت' },
  'none': { en: 'None', fr: 'Aucun', ar: 'لا شيء' },
  'selectOption': { en: 'Select an option', fr: 'Sélectionner une option', ar: 'اختر خياراً' }
};

// Fonction pour ajouter des traductions à une section
function addToSection(content, language, section, translations) {
  const sectionPattern = new RegExp(`(${language}:[\\s\\S]*?${section}:\\s*{[\\s\\S]*?)(\\n\\s*},)`, 'g');
  const match = sectionPattern.exec(content);
  
  if (match) {
    let additions = '';
    Object.keys(translations).forEach(key => {
      if (!match[1].includes(`${key}:`)) {
        additions += `,\n      ${key}: "${translations[key]}"`;
      }
    });
    
    if (additions) {
      return content.replace(match[0], match[1] + additions + match[2]);
    }
  }
  
  return content;
}

// Ajouter les traductions pour chaque langue
console.log('🔧 Ajout des traductions communes...');

// Anglais
const enTranslations = {};
Object.keys(criticalTranslations).forEach(key => {
  enTranslations[key] = criticalTranslations[key].en;
});
content = addToSection(content, 'en', 'common', enTranslations);

// Français
const frTranslations = {};
Object.keys(criticalTranslations).forEach(key => {
  frTranslations[key] = criticalTranslations[key].fr;
});
content = addToSection(content, 'fr', 'common', frTranslations);

// Arabe
const arTranslations = {};
Object.keys(criticalTranslations).forEach(key => {
  arTranslations[key] = criticalTranslations[key].ar;
});
content = addToSection(content, 'ar', 'common', arTranslations);

// Ajouter la section theme si elle n'existe pas
const themeTranslations = {
  en: { light: 'Light', dark: 'Dark', system: 'System' },
  fr: { light: 'Clair', dark: 'Sombre', system: 'Système' },
  ar: { light: 'فاتح', dark: 'داكن', system: 'النظام' }
};

['en', 'fr', 'ar'].forEach(lang => {
  if (!content.includes(`${lang}:[\\s\\S]*?theme:`)) {
    // Ajouter la section theme
    const langPattern = new RegExp(`(${lang}:[\\s\\S]*?)(\\n\\s*},?\\s*\\n\\s*(?:en|fr|ar):|\\n\\s*}\\s*$)`, 'g');
    const match = langPattern.exec(content);
    
    if (match) {
      const themeSection = `\n\n    // Theme\n    theme: {\n      light: "${themeTranslations[lang].light}",\n      dark: "${themeTranslations[lang].dark}",\n      system: "${themeTranslations[lang].system}"\n    },`;
      content = content.replace(match[0], match[1] + themeSection + match[2]);
    }
  }
});

// Sauvegarder le fichier mis à jour
fs.writeFileSync(translationsPath, content);

console.log('✅ Traductions critiques ajoutées avec succès!');
console.log(`📊 ${Object.keys(criticalTranslations).length} clés communes ajoutées`);
console.log('📊 Section theme ajoutée pour les 3 langues');
console.log('\n🎉 CORRECTION TERMINÉE!');