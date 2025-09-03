const fs = require('fs');
const path = require('path');

console.log('🔍 Test Spécifique des Clés Lofts Problématiques\n');

// Clés spécifiques mentionnées par l'utilisateur
const specificKeys = [
  'createNewLoft',
  'addNewPropertyListing'
];

// Autres clés utilisées dans les pages /lofts/new/
const relatedKeys = [
  'createLoft',
  'loftName',
  'loftAddress', 
  'pricePerMonth',
  'creating',
  'loftCreatedSuccess',
  'loftCreatedSuccessDescription',
  'errorCreatingLoft',
  'errorCreatingLoftDescription',
  'systemError',
  'systemErrorDescription'
];

const allTestKeys = [...specificKeys, ...relatedKeys];

function testKeys() {
  const languages = ['fr', 'en', 'ar'];
  
  languages.forEach(lang => {
    console.log(`📋 Test pour ${lang.toUpperCase()}:`);
    
    const filePath = path.join(__dirname, 'public', 'locales', lang, 'lofts.json');
    
    try {
      const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log('🎯 Clés spécifiques mentionnées:');
      specificKeys.forEach(key => {
        const exists = key in translations;
        const value = translations[key];
        console.log(`  ${exists ? '✅' : '❌'} ${key}: ${exists ? `"${value}"` : 'MANQUANTE'}`);
      });
      
      console.log('\n🔗 Clés liées utilisées dans /lofts/new/:');
      relatedKeys.forEach(key => {
        const exists = key in translations;
        const value = translations[key];
        console.log(`  ${exists ? '✅' : '❌'} ${key}: ${exists ? `"${value}"` : 'MANQUANTE'}`);
      });
      
      console.log('\n📊 Résumé:');
      const presentKeys = allTestKeys.filter(key => key in translations);
      const missingKeys = allTestKeys.filter(key => !(key in translations));
      
      console.log(`  ✅ Présentes: ${presentKeys.length}/${allTestKeys.length}`);
      if (missingKeys.length > 0) {
        console.log(`  ❌ Manquantes: ${missingKeys.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur lors de la lecture de ${lang}: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  });
}

// Test des références dans le code
function testCodeReferences() {
  console.log('🔍 Vérification des références dans le code:\n');
  
  const filesToCheck = [
    'app/lofts/new/page.tsx',
    'app/lofts/new/page-simple.tsx',
    'app/lofts/new/simple-loft-form.tsx'
  ];
  
  filesToCheck.forEach(filePath => {
    console.log(`📄 ${filePath}:`);
    
    try {
      const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
      
      // Chercher les références aux clés spécifiques
      specificKeys.forEach(key => {
        const pattern1 = `t('lofts.${key}')`;
        const pattern2 = `t("lofts.${key}")`;
        const pattern3 = `t(\`lofts.${key}\`)`;
        
        const found1 = content.includes(pattern1);
        const found2 = content.includes(pattern2);
        const found3 = content.includes(pattern3);
        const found = found1 || found2 || found3;
        
        if (found) {
          const usedPattern = found1 ? pattern1 : found2 ? pattern2 : pattern3;
          console.log(`  ✅ ${key} utilisé comme: ${usedPattern}`);
        } else {
          console.log(`  ❌ ${key} non trouvé`);
        }
      });
      
    } catch (error) {
      console.log(`  ❌ Erreur lecture: ${error.message}`);
    }
    
    console.log('');
  });
}

// Exécution des tests
testKeys();
testCodeReferences();

console.log('💡 Diagnostic:');
console.log('Si toutes les clés sont présentes dans les traductions ET utilisées dans le code,');
console.log('le problème pourrait être:');
console.log('1. Configuration i18n incorrecte');
console.log('2. Namespace non chargé correctement');
console.log('3. Cache de traductions');
console.log('4. Problème de build/compilation');