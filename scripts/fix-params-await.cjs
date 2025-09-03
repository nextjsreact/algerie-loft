const fs = require('fs');
const path = require('path');

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      callback(filePath);
    }
  });
}

// Fonction pour corriger les params dans un fichier
function fixParams(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Pattern pour détecter les fonctions avec params destructurés
  const patterns = [
    // Pattern 1: params: { id } ou params: { locale, id }
    {
      from: /export\s+default\s+async\s+function\s+\w+\(\s*{\s*([^}]*),\s*params:\s*{\s*([^}]+)\s*}\s*([^}]*)\s*}\s*:\s*[^)]+\)\s*{/g,
      to: (match, beforeParams, paramsContent, afterParams) => {
        const newMatch = match.replace(
          /params:\s*{\s*([^}]+)\s*}/,
          'params'
        );
        return newMatch;
      }
    },
    // Pattern 2: Simple params destructuring
    {
      from: /params:\s*{\s*([^}]+)\s*}/g,
      to: 'params'
    }
  ];

  // Appliquer les corrections de signature
  patterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      if (typeof pattern.to === 'function') {
        content = content.replace(pattern.from, pattern.to);
      } else {
        content = content.replace(pattern.from, pattern.to);
      }
      hasChanges = true;
    }
  });

  // Ajouter l'await des params au début de la fonction
  if (hasChanges) {
    // Chercher les variables destructurées des params
    const paramVars = [];
    const paramMatches = content.match(/params:\s*{\s*([^}]+)\s*}/g);
    if (paramMatches) {
      paramMatches.forEach(match => {
        const vars = match.match(/{\s*([^}]+)\s*}/)[1];
        vars.split(',').forEach(v => {
          const varName = v.trim().split(':')[0].trim();
          if (!paramVars.includes(varName)) {
            paramVars.push(varName);
          }
        });
      });
    }

    // Ajouter l'await au début de la fonction
    if (paramVars.length > 0) {
      const awaitStatement = `  const { ${paramVars.join(', ')} } = await params;\n`;
      
      // Trouver le début de la fonction et ajouter l'await
      content = content.replace(
        /(export\s+default\s+async\s+function\s+\w+\([^)]+\)\s*{\s*)/,
        `$1${awaitStatement}\n`
      );
    }
  }

  // Corrections spécifiques pour les types d'interface
  const interfaceCorrections = [
    {
      from: /params:\s*{\s*([^}]+)\s*}/g,
      to: 'params: Promise<{ $1 }>'
    }
  ];

  interfaceCorrections.forEach(correction => {
    if (correction.from.test(content)) {
      content = content.replace(correction.from, correction.to);
      hasChanges = true;
    }
  });

  // Sauvegarder le fichier s'il y a des changements
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigé: ${filePath}`);
    return true;
  }
  
  return false;
}

// Corriger les params dans le dossier [locale]
const localeDir = 'app/[locale]';
let totalFiles = 0;
let fixedFiles = 0;

console.log('🔧 Correction des params await...\n');

if (fs.existsSync(localeDir)) {
  walkDir(localeDir, (filePath) => {
    totalFiles++;
    if (fixParams(filePath)) {
      fixedFiles++;
    }
  });
}

console.log(`\n🎉 Correction terminée !`);
console.log(`📊 Statistiques:`);
console.log(`   - Fichiers analysés: ${totalFiles}`);
console.log(`   - Fichiers corrigés: ${fixedFiles}`);
console.log(`   - Fichiers non modifiés: ${totalFiles - fixedFiles}`);