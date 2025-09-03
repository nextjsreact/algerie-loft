const fs = require('fs');
const path = require('path');

// Lire le fichier de traductions
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

console.log('🔍 VALIDATION PROFESSIONNELLE DU SYSTÈME DE TRADUCTIONS\n');

// Extraire les clés pour chaque langue
function extractKeysFromLanguage(content, language) {
  const keys = new Set();
  
  // Pattern pour trouver la section de la langue
  const langPattern = new RegExp(`${language}:\\s*{([\\s\\S]*?)(?=\\n\\s*},?\\s*\\n\\s*(?:en|fr|ar):|\\n\\s*}\\s*$)`, 'g');
  const langMatch = langPattern.exec(content);
  
  if (!langMatch) return keys;
  
  const langContent = langMatch[1];
  
  // Extraire toutes les clés de traduction
  const keyPattern = /(\w+(?:\.\w+)*)\s*:\s*["'][^"']*["']/g;
  let match;
  
  // Traiter les sections principales
  const sectionPattern = /(\w+):\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
  let sectionMatch;
  
  while ((sectionMatch = sectionPattern.exec(langContent)) !== null) {
    const sectionName = sectionMatch[1];
    const sectionContent = sectionMatch[2];
    
    // Extraire les clés de la section
    const subKeyPattern = /(\w+)\s*:\s*["'][^"']*["']/g;
    let subMatch;
    
    while ((subMatch = subKeyPattern.exec(sectionContent)) !== null) {
      keys.add(`${sectionName}.${subMatch[1]}`);
    }
    
    // Traiter les sous-sections
    const subSectionPattern = /(\w+):\s*{([^{}]*)}/g;
    let subSectionMatch;
    
    while ((subSectionMatch = subSectionPattern.exec(sectionContent)) !== null) {
      const subSectionName = subSectionMatch[1];
      const subSectionContent = subSectionMatch[2];
      
      const subSubKeyPattern = /(\w+)\s*:\s*["'][^"']*["']/g;
      let subSubMatch;
      
      while ((subSubMatch = subSubKeyPattern.exec(subSectionContent)) !== null) {
        keys.add(`${sectionName}.${subSectionName}.${subSubMatch[1]}`);
      }
    }
  }
  
  return keys;
}

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
  return usedKeys;
}

// Analyser les traductions
const languages = ['en', 'fr', 'ar'];
const translationKeys = {};
const usedKeys = findUsedKeys(path.join(__dirname, '..'));

// Filtrer les clés valides (ignorer les clés avec des caractères spéciaux)
const validUsedKeys = Array.from(usedKeys).filter(key => 
  /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(key)
);

console.log(`📊 STATISTIQUES GÉNÉRALES:`);
console.log(`- Clés utilisées dans le code: ${validUsedKeys.length}`);

languages.forEach(lang => {
  translationKeys[lang] = extractKeysFromLanguage(content, lang);
  console.log(`- Clés ${lang.toUpperCase()}: ${translationKeys[lang].size}`);
});

// Analyser les clés manquantes
console.log(`\n❌ CLÉS MANQUANTES PAR LANGUE:`);
let totalMissing = 0;

languages.forEach(lang => {
  const missing = validUsedKeys.filter(key => !translationKeys[lang].has(key));
  console.log(`\n${lang.toUpperCase()} (${missing.length} manquantes):`);
  
  if (missing.length === 0) {
    console.log('  ✅ Toutes les clés sont présentes');
  } else {
    missing.forEach(key => {
      console.log(`  - ${key}`);
    });
    totalMissing += missing.length;
  }
});

// Analyser la cohérence entre langues
console.log(`\n🔄 COHÉRENCE ENTRE LANGUES:`);
const enKeys = translationKeys['en'];
const frKeys = translationKeys['fr'];
const arKeys = translationKeys['ar'];

const onlyInEn = Array.from(enKeys).filter(key => !frKeys.has(key) || !arKeys.has(key));
const onlyInFr = Array.from(frKeys).filter(key => !enKeys.has(key) || !arKeys.has(key));
const onlyInAr = Array.from(arKeys).filter(key => !enKeys.has(key) || !frKeys.has(key));

if (onlyInEn.length > 0) {
  console.log(`\nClés uniquement en ANGLAIS (${onlyInEn.length}):`);
  onlyInEn.forEach(key => console.log(`  - ${key}`));
}

if (onlyInFr.length > 0) {
  console.log(`\nClés uniquement en FRANÇAIS (${onlyInFr.length}):`);
  onlyInFr.forEach(key => console.log(`  - ${key}`));
}

if (onlyInAr.length > 0) {
  console.log(`\nClés uniquement en ARABE (${onlyInAr.length}):`);
  onlyInAr.forEach(key => console.log(`  - ${key}`));
}

// Résumé final
console.log(`\n📋 RÉSUMÉ DE LA VALIDATION:`);
console.log(`- État général: ${totalMissing === 0 ? '✅ EXCELLENT' : '⚠️  NÉCESSITE ATTENTION'}`);
console.log(`- Clés manquantes total: ${totalMissing}`);
console.log(`- Cohérence entre langues: ${(onlyInEn.length + onlyInFr.length + onlyInAr.length) === 0 ? '✅ PARFAITE' : '⚠️  INCOHÉRENCES DÉTECTÉES'}`);

if (totalMissing === 0 && (onlyInEn.length + onlyInFr.length + onlyInAr.length) === 0) {
  console.log(`\n🎉 FÉLICITATIONS! Le système de traductions est PARFAITEMENT configuré!`);
} else {
  console.log(`\n🔧 ACTIONS RECOMMANDÉES:`);
  if (totalMissing > 0) {
    console.log(`- Ajouter les ${totalMissing} clés manquantes`);
  }
  if ((onlyInEn.length + onlyInFr.length + onlyInAr.length) > 0) {
    console.log(`- Synchroniser les clés entre toutes les langues`);
  }
}