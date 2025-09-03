const fs = require('fs');
const path = require('path');

// Fonction pour extraire les clés de traduction d'un fichier
function extractKeysFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex pour capturer t('key') et t("key")
    const regex = /t\(['"]([^'"]+)['"]\)/g;
    const keys = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      keys.push(match[1]);
    }
    
    return keys;
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}:`, error.message);
    return [];
  }
}

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorer certains dossiers
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extraire toutes les clés
console.log('🔍 Extraction des clés de traduction...\n');

const files = walkDir('.');
const allKeys = new Set();

files.forEach(file => {
  const keys = extractKeysFromFile(file);
  keys.forEach(key => allKeys.add(key));
});

// Organiser les clés par section
const keysBySection = {};
Array.from(allKeys).sort().forEach(key => {
  const section = key.split('.')[0];
  if (!keysBySection[section]) {
    keysBySection[section] = [];
  }
  keysBySection[section].push(key);
});

// Afficher les résultats
console.log('📋 Clés de traduction trouvées:\n');
Object.keys(keysBySection).sort().forEach(section => {
  console.log(`\n🔸 ${section.toUpperCase()}:`);
  keysBySection[section].forEach(key => {
    console.log(`  - ${key}`);
  });
});

console.log(`\n📊 Total: ${allKeys.size} clés de traduction trouvées`);

// Sauvegarder dans un fichier JSON
const result = {
  totalKeys: allKeys.size,
  keysBySection,
  allKeys: Array.from(allKeys).sort()
};

fs.writeFileSync('translation-keys-analysis.json', JSON.stringify(result, null, 2));
console.log('\n💾 Analyse sauvegardée dans: translation-keys-analysis.json');