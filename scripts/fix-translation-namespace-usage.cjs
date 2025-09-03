const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fonction pour corriger les références de traduction dans un fichier
function fixTranslationReferences(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Pattern pour trouver t('transactions.key') et le remplacer par t('key', { ns: 'transactions' })
    const pattern = /t\('transactions\.([^']+)'\)/g;
    
    const newContent = content.replace(pattern, (match, key) => {
      hasChanges = true;
      return `t('${key}', { ns: 'transactions' })`;
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Fonction principale
function main() {
  console.log('🔧 Fixing translation namespace usage...\n');
  
  // Chercher tous les fichiers TypeScript et JavaScript dans components/
  const patterns = [
    'components/**/*.tsx',
    'components/**/*.ts',
    'app/**/*.tsx',
    'app/**/*.ts'
  ];
  
  let totalFixed = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(file => {
      if (fixTranslationReferences(file)) {
        totalFixed++;
      }
    });
  });
  
  console.log(`\n✅ Fixed ${totalFixed} files with translation namespace issues!`);
  console.log('\n📋 Changes made:');
  console.log("- t('transactions.key') → t('key', { ns: 'transactions' })");
  console.log('- This ensures translations are loaded from the correct namespace');
}

// Vérifier si glob est disponible
try {
  require('glob');
  main();
} catch (error) {
  console.log('Installing glob dependency...');
  const { execSync } = require('child_process');
  execSync('npm install glob', { stdio: 'inherit' });
  main();
}