const fs = require('fs');

// Lire les clés utilisées dans l'application
const usedKeys = JSON.parse(fs.readFileSync('real-translation-keys.json', 'utf8')).allKeys;

// Lire le fichier de traductions actuel
const translationsContent = fs.readFileSync('lib/i18n/translations.ts', 'utf8');

// Extraire les clés existantes du fichier de traductions
function extractExistingKeys(content) {
  const keys = new Set();
  
  // Regex pour capturer les clés dans le fichier de traductions
  // Cherche les patterns comme "keyName:" au début d'une ligne
  const regex = /^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:/gm;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  // Aussi chercher les clés imbriquées comme "section.key"
  const lines = content.split('\n');
  let currentSection = '';
  let currentSubsection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Détecter les sections principales
    if (trimmed.match(/^[a-zA-Z][a-zA-Z0-9_]*:\s*{/)) {
      currentSection = trimmed.split(':')[0].trim();
      currentSubsection = '';
      continue;
    }
    
    // Détecter les sous-sections
    if (currentSection && trimmed.match(/^[a-zA-Z][a-zA-Z0-9_]*:\s*{/)) {
      currentSubsection = trimmed.split(':')[0].trim();
      continue;
    }
    
    // Détecter les clés
    if (trimmed.match(/^[a-zA-Z][a-zA-Z0-9_]*:\s*["']/)) {
      const keyName = trimmed.split(':')[0].trim();
      
      if (currentSubsection) {
        keys.add(`${currentSection}.${currentSubsection}.${keyName}`);
      } else if (currentSection) {
        keys.add(`${currentSection}.${keyName}`);
      }
    }
    
    // Réinitialiser les sections quand on ferme des accolades
    if (trimmed === '},' || trimmed === '}') {
      if (currentSubsection) {
        currentSubsection = '';
      } else if (currentSection) {
        currentSection = '';
      }
    }
  }
  
  return keys;
}

const existingKeys = extractExistingKeys(translationsContent);

// Trouver les clés manquantes
const missingKeys = usedKeys.filter(key => !existingKeys.has(key));

// Organiser les clés manquantes par section
const missingBySection = {};
missingKeys.forEach(key => {
  const section = key.split('.')[0];
  if (!missingBySection[section]) {
    missingBySection[section] = [];
  }
  missingBySection[section].push(key);
});

console.log('🔍 ANALYSE DES TRADUCTIONS MANQUANTES\n');
console.log(`📊 Statistiques:`);
console.log(`   - Clés utilisées dans l'app: ${usedKeys.length}`);
console.log(`   - Clés existantes: ${existingKeys.size}`);
console.log(`   - Clés manquantes: ${missingKeys.length}`);

if (missingKeys.length > 0) {
  console.log('\n❌ CLÉS MANQUANTES PAR SECTION:\n');
  
  Object.keys(missingBySection).sort().forEach(section => {
    console.log(`🔸 ${section.toUpperCase()} (${missingBySection[section].length} manquantes):`);
    missingBySection[section].forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log('');
  });
} else {
  console.log('\n✅ TOUTES LES CLÉS SONT PRÉSENTES !');
}

// Sauvegarder l'analyse
const analysis = {
  totalUsedKeys: usedKeys.length,
  totalExistingKeys: existingKeys.size,
  totalMissingKeys: missingKeys.length,
  missingKeys,
  missingBySection,
  existingKeys: Array.from(existingKeys).sort()
};

fs.writeFileSync('missing-translations-analysis.json', JSON.stringify(analysis, null, 2));
console.log('💾 Analyse complète sauvegardée dans: missing-translations-analysis.json');