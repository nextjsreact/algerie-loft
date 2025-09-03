// Script pour nettoyer les doublons dans les traductions
const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(translationsPath, 'utf8');

console.log('🧹 Nettoyage des doublons dans les traductions...');

// Fonction pour supprimer les doublons d'une propriété
function removeDuplicateProperty(content, propertyName, language) {
  const regex = new RegExp(`(${language}:[\\s\\S]*?)${propertyName}:\\s*\\{[\\s\\S]*?\\}`, 'g');
  const matches = content.match(regex);
  
  if (matches && matches.length > 1) {
    console.log(`   Trouvé ${matches.length} doublons de ${propertyName} en ${language}`);
    
    // Garder seulement le dernier (le plus récent)
    const lastMatch = matches[matches.length - 1];
    
    // Supprimer tous les autres
    for (let i = 0; i < matches.length - 1; i++) {
      content = content.replace(matches[i], matches[i].replace(new RegExp(`${propertyName}:\\s*\\{[\\s\\S]*?\\}`), ''));
    }
  }
  
  return content;
}

// Nettoyer les doublons pour chaque langue
const languages = ['en', 'fr', 'ar'];
const properties = ['zoneAreas', 'internetConnections'];

languages.forEach(lang => {
  console.log(`🌐 Nettoyage de la langue ${lang.toUpperCase()}:`);
  properties.forEach(prop => {
    content = removeDuplicateProperty(content, prop, lang);
  });
});

// Nettoyer les lignes vides multiples
content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

// Nettoyer les virgules orphelines
content = content.replace(/,\s*\n\s*,/g, ',');

// Nettoyer les accolades vides
content = content.replace(/\{\s*\}/g, '{}');

// Sauvegarder le fichier nettoyé
fs.writeFileSync(translationsPath, content, 'utf8');

console.log('✅ Nettoyage terminé !');

// Vérifier la syntaxe
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit lib/i18n/translations.ts', { stdio: 'pipe' });
  console.log('✅ Syntaxe TypeScript correcte !');
} catch (error) {
  console.log('❌ Erreurs de syntaxe détectées :');
  console.log(error.stdout.toString());
}