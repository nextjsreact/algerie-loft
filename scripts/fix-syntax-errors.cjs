const fs = require('fs');
const path = require('path');

function fixSyntaxErrors() {
  const translationsPath = path.join(__dirname, '..', 'lib', 'i18n', 'translations.ts');
  let content = fs.readFileSync(translationsPath, 'utf8');
  
  console.log('🔧 Correction des erreurs de syntaxe...');
  
  // Corriger les lignes mal formatées (sans virgule et sans saut de ligne)
  content = content.replace(/(".*?")(\s+)([a-zA-Z_][a-zA-Z0-9_.]*:)/g, '$1,\n      $3');
  
  // Corriger les objets imbriqués mal formatés
  content = content.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)\./g, ': {\n        $1.');
  content = content.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*): /g, ': {\n        $1: ');
  
  // Ajouter les fermetures d'objets manquantes
  content = content.replace(/: "([^"]*)",(\s+)([a-zA-Z_][a-zA-Z0-9_]*): {/g, ': "$1"\n      },\n      $3: {');
  
  fs.writeFileSync(translationsPath, content, 'utf8');
  console.log('✅ Erreurs de syntaxe corrigées');
}

fixSyntaxErrors();