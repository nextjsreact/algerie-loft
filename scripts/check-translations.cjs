// Script de vérification des traductions
const fs = require('fs');
const path = require('path');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

console.log('🔍 Vérification des traductions manquantes...\n');

// Extraire les clés utilisées dans les composants
const componentsDir = path.join(__dirname, '../app/settings');
const componentFiles = [];

function findTsxFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findTsxFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      componentFiles.push(filePath);
    }
  });
}

findTsxFiles(componentsDir);

// Extraire les clés de traduction utilisées
const usedKeys = new Set();
const keyRegex = /t\(['"`]([^'"`]+)['"`]\)/g;

componentFiles.forEach(file => {
  const fileContent = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = keyRegex.exec(fileContent)) !== null) {
    usedKeys.add(match[1]);
  }
});

console.log('📝 Clés de traduction utilisées dans les composants settings:');
const sortedKeys = Array.from(usedKeys).sort();
sortedKeys.forEach(key => {
  console.log(`   ${key}`);
});

console.log(`\n📊 Total: ${usedKeys.size} clés utilisées\n`);

// Vérifier si les clés existent dans les traductions
const languages = ['en', 'fr', 'ar'];
const missingKeys = {};

languages.forEach(lang => {
  missingKeys[lang] = [];
  
  sortedKeys.forEach(key => {
    // Construire le regex pour vérifier si la clé existe
    const keyPath = key.split('.');
    let regex = `${lang}:[\\s\\S]*?`;
    
    keyPath.forEach((part, index) => {
      if (index === keyPath.length - 1) {
        regex += `${part}:\\s*["']`;
      } else {
        regex += `${part}:[\\s\\S]*?`;
      }
    });
    
    const keyRegex = new RegExp(regex, 'g');
    if (!keyRegex.test(content)) {
      missingKeys[lang].push(key);
    }
  });
});

// Afficher les résultats
languages.forEach(lang => {
  console.log(`🌐 Langue: ${lang.toUpperCase()}`);
  if (missingKeys[lang].length === 0) {
    console.log('   ✅ Toutes les clés sont présentes');
  } else {
    console.log(`   ❌ ${missingKeys[lang].length} clés manquantes:`);
    missingKeys[lang].forEach(key => {
      console.log(`      - ${key}`);
    });
  }
  console.log('');
});

// Générer les traductions manquantes
if (Object.values(missingKeys).some(keys => keys.length > 0)) {
  console.log('🔧 Génération des traductions manquantes...\n');
  
  languages.forEach(lang => {
    if (missingKeys[lang].length > 0) {
      console.log(`// Traductions manquantes pour ${lang.toUpperCase()}:`);
      missingKeys[lang].forEach(key => {
        const keyPath = key.split('.');
        const lastKey = keyPath[keyPath.length - 1];
        console.log(`${lastKey}: "${key.replace(/\./g, ' ')}",`);
      });
      console.log('');
    }
  });
}

console.log('✅ Vérification terminée !');