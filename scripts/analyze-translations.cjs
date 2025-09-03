const fs = require('fs');
const path = require('path');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

console.log('🔍 ANALYSE COMPLÈTE DU SYSTÈME DE TRADUCTIONS\n');

// Rechercher les clés utilisées dans le code
function findUsedKeys(directory) {
  const usedKeys = new Set();
  
  function scanFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const keyRegex = /t\(['"]([\w.]+)['"]\)/g;
      let match;
      
      while ((match = keyRegex.exec(fileContent)) !== null) {
        usedKeys.add(match[1]);
      }
    } catch (error) {
      // Ignorer les erreurs de lecture
    }
  }
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          scanFile(fullPath);
        }
      });
    } catch (error) {
      // Ignorer les erreurs de lecture de dossier
    }
  }
  
  scanDirectory(directory);
  return Array.from(usedKeys).sort();
}

const usedKeys = findUsedKeys(path.join(__dirname, '..'));
console.log(`🎯 CLÉS UTILISÉES DANS LE CODE: ${usedKeys.length}\n`);

// Afficher toutes les clés utilisées
usedKeys.forEach(key => {
  console.log(`  - ${key}`);
});

console.log('\n📊 ANALYSE TERMINÉE');
console.log(`Total des clés de traduction utilisées: ${usedKeys.length}`);