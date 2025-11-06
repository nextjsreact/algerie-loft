const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC APPROFONDI DES TRADUCTIONS\n');

// 1. Vérifier les fichiers de traduction
const messagesDir = path.join(__dirname, 'messages');
const locales = ['fr', 'en', 'ar'];

console.log('📁 Vérification des fichiers de traduction:');
locales.forEach(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${locale}.json - Taille: ${Math.round(stats.size / 1024)}KB - Modifié: ${stats.mtime.toLocaleString()}`);
  } else {
    console.log(`❌ ${locale}.json - FICHIER MANQUANT`);
  }
});

// 2. Vérifier la structure des namespaces
console.log('\n🏗️ Vérification de la structure des namespaces:');
locales.forEach(locale => {
  try {
    const filePath = path.join(messagesDir, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`\n📋 ${locale.toUpperCase()}:`);
    console.log(`  - Namespaces racine: ${Object.keys(content).length}`);
    
    // Vérifier les namespaces critiques
    const criticalNamespaces = ['lofts', 'common', 'nav', 'auth', 'dashboard'];
    criticalNamespaces.forEach(ns => {
      if (content[ns]) {
        const keys = Object.keys(content[ns]);
        console.log(`  - ${ns}: ${keys.length} clés`);
        
        // Vérifier les clés spécifiques problématiques
        if (ns === 'lofts') {
          const loftKeys = ['editLoft', 'updatePropertyDetails', 'addLoft'];
          loftKeys.forEach(key => {
            if (content[ns][key]) {
              console.log(`    ✅ ${key}: "${content[ns][key]}"`);
            } else {
              console.log(`    ❌ ${key}: MANQUANT`);
            }
          });
        }
      } else {
        console.log(`  - ${ns}: ❌ NAMESPACE MANQUANT`);
      }
    });
  } catch (error) {
    console.log(`❌ Erreur lors de la lecture de ${locale}.json:`, error.message);
  }
});

// 3. Vérifier la configuration i18n
console.log('\n⚙️ Vérification de la configuration i18n:');
try {
  const i18nPath = path.join(__dirname, 'i18n.ts');
  if (fs.existsSync(i18nPath)) {
    const i18nContent = fs.readFileSync(i18nPath, 'utf8');
    console.log('✅ i18n.ts existe');
    
    // Vérifier les locales supportées
    const localesMatch = i18nContent.match(/locales = \[(.*?)\]/s);
    if (localesMatch) {
      console.log(`  - Locales configurées: ${localesMatch[1]}`);
    }
    
    // Vérifier l'import des messages
    if (i18nContent.includes('@/messages/')) {
      console.log('  ✅ Import des messages configuré');
    } else {
      console.log('  ❌ Import des messages non trouvé');
    }
  } else {
    console.log('❌ i18n.ts manquant');
  }
} catch (error) {
  console.log('❌ Erreur lors de la vérification i18n:', error.message);
}

// 4. Vérifier le middleware
console.log('\n🛡️ Vérification du middleware:');
try {
  const middlewarePath = path.join(__dirname, 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    console.log('✅ middleware.ts existe');
    
    if (middlewareContent.includes('next-intl/middleware')) {
      console.log('  ✅ next-intl middleware importé');
    }
    
    if (middlewareContent.includes("locales: ['fr', 'ar', 'en']")) {
      console.log('  ✅ Locales configurées dans le middleware');
    }
  } else {
    console.log('❌ middleware.ts manquant');
  }
} catch (error) {
  console.log('❌ Erreur lors de la vérification middleware:', error.message);
}

// 5. Test de chargement des traductions
console.log('\n🧪 Test de chargement des traductions:');
try {
  const frMessages = JSON.parse(fs.readFileSync(path.join(messagesDir, 'fr.json'), 'utf8'));
  
  // Test d'accès aux clés problématiques
  const testKeys = [
    'lofts.editLoft',
    'lofts.updatePropertyDetails',
    'common.loading',
    'nav.dashboard'
  ];
  
  testKeys.forEach(keyPath => {
    const keys = keyPath.split('.');
    let value = frMessages;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = null;
        break;
      }
    }
    
    if (value) {
      console.log(`  ✅ ${keyPath}: "${value}"`);
    } else {
      console.log(`  ❌ ${keyPath}: INACCESSIBLE`);
    }
  });
} catch (error) {
  console.log('❌ Erreur lors du test de chargement:', error.message);
}

console.log('\n🏁 Diagnostic terminé');