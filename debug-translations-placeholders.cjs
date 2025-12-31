const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnostic des traductions placeholders...\n');

// Lire les fichiers de traduction
const languages = ['fr', 'en', 'ar'];
const translations = {};

languages.forEach(lang => {
  const filePath = path.join(__dirname, 'messages', `${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    translations[lang] = JSON.parse(content);
    console.log(`✅ ${lang}.json chargé avec succès`);
  } catch (error) {
    console.log(`❌ Erreur lors du chargement de ${lang}.json:`, error.message);
  }
});

console.log('\n📋 Vérification des placeholders dans settings.categories.form:\n');

languages.forEach(lang => {
  console.log(`--- ${lang.toUpperCase()} ---`);
  
  const categories = translations[lang]?.settings?.categories;
  if (!categories) {
    console.log(`❌ settings.categories non trouvé`);
    return;
  }
  
  const form = categories.form;
  if (!form) {
    console.log(`❌ settings.categories.form non trouvé`);
    return;
  }
  
  const placeholders = [
    'namePlaceholder',
    'descriptionPlaceholder', 
    'colorPlaceholder',
    'iconPlaceholder'
  ];
  
  placeholders.forEach(key => {
    const value = form[key];
    if (value) {
      console.log(`✅ ${key}: "${value}"`);
    } else {
      console.log(`❌ ${key}: MANQUANT`);
    }
  });
  
  console.log('');
});

console.log('🔍 Vérification de l\'encodage des caractères arabes:');
const arForm = translations.ar?.settings?.categories?.form;
if (arForm) {
  console.log(`Nom placeholder: "${arForm.namePlaceholder}" (${arForm.namePlaceholder.length} caractères)`);
  console.log(`Description placeholder: "${arForm.descriptionPlaceholder}" (${arForm.descriptionPlaceholder.length} caractères)`);
  console.log(`Icon placeholder: "${arForm.iconPlaceholder}" (${arForm.iconPlaceholder.length} caractères)`);
  
  // Vérifier l'encodage UTF-8
  const iconText = arForm.iconPlaceholder;
  console.log(`Codes de caractères pour "${iconText}":`, [...iconText].map(c => c.charCodeAt(0)));
}