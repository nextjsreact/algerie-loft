#!/usr/bin/env node

/**
 * Debug - Identifier tous les endroits où le rôle utilisateur est affiché
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug - Affichage du rôle utilisateur\n');

// Fonction pour rechercher dans un fichier
function searchInFile(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      if (matches) {
        // Trouver les lignes contenant les matches
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            results.push({
              pattern,
              line: index + 1,
              content: line.trim(),
              match: matches[0]
            });
          }
        });
      }
    });
    
    return results;
  } catch (error) {
    return [];
  }
}

// Fonction pour parcourir récursivement les dossiers
function searchInDirectory(dir, patterns, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        results.push(...searchInDirectory(fullPath, patterns, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        const fileResults = searchInFile(fullPath, patterns);
        if (fileResults.length > 0) {
          results.push({
            file: fullPath,
            matches: fileResults
          });
        }
      }
    });
  } catch (error) {
    // Ignorer les erreurs de permission
  }
  
  return results;
}

// Patterns à rechercher
const patterns = [
  'Administrateur',
  'session\\.user\\.role.*admin',
  'user\\.role.*admin',
  'role.*===.*[\'"]admin[\'"]',
  'getRoleDisplayName',
  'getRoleConfig',
  'role.*===.*[\'"]manager[\'"]'
];

console.log('🔍 Recherche des patterns de rôle...\n');

// Rechercher dans les composants
const results = searchInDirectory('./components', patterns);
const appResults = searchInDirectory('./app', patterns);

// Combiner les résultats
const allResults = [...results, ...appResults];

console.log(`📊 Trouvé ${allResults.length} fichiers avec des références aux rôles:\n`);

allResults.forEach(result => {
  console.log(`📄 ${result.file}`);
  result.matches.forEach(match => {
    console.log(`   Ligne ${match.line}: ${match.content}`);
    console.log(`   Pattern: ${match.pattern}`);
    console.log('');
  });
  console.log('---\n');
});

// Rechercher spécifiquement les composants qui pourraient afficher "Administrateur"
console.log('🎯 Composants suspects pour l\'affichage "Administrateur":\n');

const suspectFiles = allResults.filter(result => 
  result.matches.some(match => 
    match.content.includes('Administrateur') || 
    match.content.includes('session.user.role') ||
    match.content.includes('user.role')
  )
);

suspectFiles.forEach(result => {
  console.log(`🚨 ${result.file}`);
  result.matches.forEach(match => {
    if (match.content.includes('Administrateur') || 
        match.content.includes('session.user.role') ||
        match.content.includes('user.role')) {
      console.log(`   ⚠️  Ligne ${match.line}: ${match.content}`);
    }
  });
  console.log('');
});

console.log('\n✅ Analyse terminée. Vérifiez les composants suspects ci-dessus.');