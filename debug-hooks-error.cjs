#!/usr/bin/env node

/**
 * Debug - Identifier les hooks conditionnels qui causent l'erreur
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug - Hooks Conditionnels Problématiques\n');

// Fonction pour analyser un fichier
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();
      
      // Détecter les hooks conditionnels problématiques
      const hookPatterns = [
        /if\s*\([^)]*\)\s*{[^}]*use[A-Z]/,  // if (...) { useHook
        /\?\s*use[A-Z]/,                     // condition ? useHook
        /&&\s*use[A-Z]/,                     // condition && useHook
        /use[A-Z][^(]*\([^)]*\)\s*&&/,      // useHook() && condition
        /use[A-Z][^(]*\([^)]*\)\s*\?/       // useHook() ? condition
      ];
      
      hookPatterns.forEach((pattern, patternIndex) => {
        if (pattern.test(trimmedLine)) {
          issues.push({
            line: lineNum,
            content: trimmedLine,
            type: `Pattern ${patternIndex + 1}`,
            severity: 'HIGH'
          });
        }
      });
      
      // Détecter les hooks dans des boucles
      if (/for\s*\(|while\s*\(|\.map\s*\(|\.forEach\s*\(/.test(trimmedLine) && 
          /use[A-Z]/.test(trimmedLine)) {
        issues.push({
          line: lineNum,
          content: trimmedLine,
          type: 'Hook in loop',
          severity: 'HIGH'
        });
      }
      
      // Détecter les early returns après des hooks
      if (index > 0 && /use[A-Z]/.test(lines[index - 1]) && 
          /return\s/.test(trimmedLine) && !trimmedLine.includes('return (')) {
        issues.push({
          line: lineNum,
          content: `${lines[index - 1].trim()} → ${trimmedLine}`,
          type: 'Early return after hook',
          severity: 'MEDIUM'
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [];
  }
}

// Fonction pour parcourir les dossiers
function scanDirectory(dir, extensions = ['.tsx', '.ts']) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        results.push(...scanDirectory(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        const issues = analyzeFile(fullPath);
        if (issues.length > 0) {
          results.push({
            file: fullPath,
            issues
          });
        }
      }
    });
  } catch (error) {
    // Ignorer les erreurs de permission
  }
  
  return results;
}

// Scanner les composants et hooks
console.log('🔍 Analyse des hooks conditionnels...\n');

const componentsResults = scanDirectory('./components');
const hooksResults = scanDirectory('./hooks');
const appResults = scanDirectory('./app');

const allResults = [...componentsResults, ...hooksResults, ...appResults];

console.log(`📊 Trouvé ${allResults.length} fichiers avec des problèmes potentiels:\n`);

// Trier par sévérité
allResults.forEach(result => {
  const highSeverityIssues = result.issues.filter(issue => issue.severity === 'HIGH');
  const mediumSeverityIssues = result.issues.filter(issue => issue.severity === 'MEDIUM');
  
  if (highSeverityIssues.length > 0) {
    console.log(`🚨 ${result.file}`);
    highSeverityIssues.forEach(issue => {
      console.log(`   ❌ Ligne ${issue.line} (${issue.type}): ${issue.content}`);
    });
    console.log('');
  }
  
  if (mediumSeverityIssues.length > 0) {
    console.log(`⚠️  ${result.file}`);
    mediumSeverityIssues.forEach(issue => {
      console.log(`   ⚠️  Ligne ${issue.line} (${issue.type}): ${issue.content}`);
    });
    console.log('');
  }
});

// Recommandations spécifiques
console.log('💡 RECOMMANDATIONS POUR CORRIGER:');
console.log('='.repeat(50));
console.log('1. Déplacer tous les hooks au début du composant');
console.log('2. Ne jamais appeler de hooks dans des conditions');
console.log('3. Ne jamais appeler de hooks dans des boucles');
console.log('4. Utiliser des variables d\'état pour les conditions');
console.log('5. Éviter les early returns après des hooks');

console.log('\n🔧 EXEMPLE DE CORRECTION:');
console.log('❌ INCORRECT:');
console.log('if (condition) {');
console.log('  const [state, setState] = useState(false);');
console.log('}');
console.log('');
console.log('✅ CORRECT:');
console.log('const [state, setState] = useState(false);');
console.log('if (condition) {');
console.log('  // utiliser state ici');
console.log('}');

if (allResults.length === 0) {
  console.log('\n✅ Aucun hook conditionnel détecté !');
  console.log('Le problème pourrait être ailleurs :');
  console.log('- Composants qui se montent/démontent rapidement');
  console.log('- Providers qui changent d\'état');
  console.log('- Erreurs dans les dépendances useEffect');
}

console.log('\n📝 PROCHAINES ÉTAPES:');
console.log('1. Corriger les hooks conditionnels trouvés');
console.log('2. Vérifier les providers pour des changements d\'état rapides');
console.log('3. Ajouter des ErrorBoundary pour isoler les erreurs');
console.log('4. Tester avec React StrictMode désactivé temporairement');