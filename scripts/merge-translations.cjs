const fs = require('fs');
const path = require('path');

const locales = ['fr', 'en', 'ar'];
const sourceDir = 'public/locales';
const targetDir = 'messages';

// Créer le dossier messages s'il n'existe pas
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

locales.forEach(locale => {
  const localeDir = path.join(sourceDir, locale);
  const mergedTranslations = {};
  
  // Lire tous les fichiers JSON du dossier locale
  const files = fs.readdirSync(localeDir).filter(file => file.endsWith('.json'));
  
  files.forEach(file => {
    const namespace = path.basename(file, '.json');
    const filePath = path.join(localeDir, file);
    
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      mergedTranslations[namespace] = content;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${filePath}:`, error);
    }
  });
  
  // Écrire le fichier fusionné
  const outputPath = path.join(targetDir, `${locale}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(mergedTranslations, null, 2));
  
  console.log(`✅ ${locale}.json créé avec ${Object.keys(mergedTranslations).length} namespaces`);
});

console.log('🎉 Fusion des traductions terminée !');