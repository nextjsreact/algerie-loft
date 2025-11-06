const fs = require('fs');
const path = require('path');

console.log('🧪 TEST RUNTIME DES TRADUCTIONS\n');

// Simuler le comportement de next-intl
function simulateNextIntl(locale, namespace) {
  try {
    const messagesPath = path.join(__dirname, 'messages', `${locale}.json`);
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    
    console.log(`📋 Simulation pour locale: ${locale}, namespace: ${namespace}`);
    
    if (!messages[namespace]) {
      console.log(`❌ Namespace '${namespace}' non trouvé`);
      return null;
    }
    
    const namespaceData = messages[namespace];
    console.log(`✅ Namespace trouvé avec ${Object.keys(namespaceData).length} clés`);
    
    // Simuler la fonction t()
    const t = (key) => {
      if (namespaceData[key]) {
        return namespaceData[key];
      } else {
        console.log(`⚠️ Clé '${key}' non trouvée dans namespace '${namespace}'`);
        return key; // Fallback comme next-intl
      }
    };
    
    return t;
  } catch (error) {
    console.log(`❌ Erreur lors du chargement: ${error.message}`);
    return null;
  }
}

// Test des cas problématiques
console.log('🔍 Test des cas problématiques:');

const testCases = [
  { locale: 'fr', namespace: 'lofts', keys: ['editLoft', 'updatePropertyDetails', 'addLoft'] },
  { locale: 'en', namespace: 'lofts', keys: ['editLoft', 'updatePropertyDetails', 'addLoft'] },
  { locale: 'ar', namespace: 'lofts', keys: ['editLoft', 'updatePropertyDetails', 'addLoft'] },
];

testCases.forEach(({ locale, namespace, keys }) => {
  console.log(`\n--- Test ${locale.toUpperCase()} ---`);
  const t = simulateNextIntl(locale, namespace);
  
  if (t) {
    keys.forEach(key => {
      const result = t(key);
      console.log(`  ${key}: "${result}"`);
    });
  }
});

// Test de la structure imbriquée
console.log('\n🏗️ Test de la structure imbriquée:');
try {
  const frMessages = JSON.parse(fs.readFileSync(path.join(__dirname, 'messages', 'fr.json'), 'utf8'));
  
  // Vérifier si les clés sont au bon endroit
  console.log('Structure du namespace lofts:');
  const loftsKeys = Object.keys(frMessages.lofts);
  console.log(`  - Nombre total de clés: ${loftsKeys.length}`);
  console.log(`  - Premières clés: ${loftsKeys.slice(0, 10).join(', ')}`);
  
  // Chercher les clés problématiques
  const problematicKeys = ['editLoft', 'updatePropertyDetails'];
  problematicKeys.forEach(key => {
    if (loftsKeys.includes(key)) {
      console.log(`  ✅ ${key} trouvé à la position ${loftsKeys.indexOf(key)}`);
    } else {
      console.log(`  ❌ ${key} non trouvé`);
      
      // Chercher dans d'autres namespaces
      Object.keys(frMessages).forEach(ns => {
        if (typeof frMessages[ns] === 'object' && frMessages[ns][key]) {
          console.log(`    🔍 Trouvé dans namespace '${ns}': "${frMessages[ns][key]}"`);
        }
      });
    }
  });
  
} catch (error) {
  console.log(`❌ Erreur lors du test de structure: ${error.message}`);
}

console.log('\n🏁 Test runtime terminé');