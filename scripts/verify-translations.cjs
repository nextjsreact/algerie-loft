const fs = require('fs');
const path = require('path');

// Configuration
const locales = ['en', 'fr', 'ar'];
const baseDir = path.join(__dirname, '../public/locales');

// Fonction pour lire un fichier JSON
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
    return {};
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return {};
  }
}

// Fonction pour obtenir toutes les clés d'un objet imbriqué
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Fonction pour vérifier les traductions
function verifyTranslations() {
  console.log('🔍 Starting translation verification...\n');
  
  const allNamespaces = new Set();
  const translations = {};
  
  // Collecter tous les namespaces et leurs clés
  for (const locale of locales) {
    const localeDir = path.join(baseDir, locale);
    
    if (fs.existsSync(localeDir)) {
      const files = fs.readdirSync(localeDir).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const namespace = file.replace('.json', '');
        allNamespaces.add(namespace);
        
        const filePath = path.join(localeDir, file);
        const data = readJsonFile(filePath);
        
        if (!translations[locale]) translations[locale] = {};
        translations[locale][namespace] = data;
      }
    }
  }
  
  // Analyser les problèmes par namespace
  const issues = {
    missingKeys: {},
    emptyTranslations: {},
    inconsistentKeys: {}
  };
  
  let totalIssues = 0;
  
  for (const namespace of allNamespaces) {
    issues.missingKeys[namespace] = {};
    issues.emptyTranslations[namespace] = {};
    issues.inconsistentKeys[namespace] = {};
    
    // Obtenir toutes les clés uniques pour ce namespace
    const allKeysForNamespace = new Set();
    for (const locale of locales) {
      const data = translations[locale]?.[namespace] || {};
      const keys = getAllKeys(data);
      keys.forEach(key => allKeysForNamespace.add(key));
    }
    
    // Vérifier chaque locale pour ce namespace
    for (const locale of locales) {
      const data = translations[locale]?.[namespace] || {};
      const keys = getAllKeys(data);
      
      // Vérifier les clés manquantes
      for (const key of allKeysForNamespace) {
        if (!keys.includes(key)) {
          if (!issues.missingKeys[namespace][locale]) {
            issues.missingKeys[namespace][locale] = [];
          }
          issues.missingKeys[namespace][locale].push(key);
          totalIssues++;
        }
      }
      
      // Vérifier les traductions vides
      for (const key of keys) {
        const value = getNestedValue(data, key);
        if (!value || value.trim() === '') {
          if (!issues.emptyTranslations[namespace][locale]) {
            issues.emptyTranslations[namespace][locale] = [];
          }
          issues.emptyTranslations[namespace][locale].push(key);
          totalIssues++;
        }
      }
    }
  }
  
  // Afficher le rapport
  console.log('📊 Translation Verification Report\n');
  
  // Clés manquantes
  console.log('❌ Missing Keys:');
  for (const [namespace, locales] of Object.entries(issues.missingKeys)) {
    for (const [locale, keys] of Object.entries(locales)) {
      if (keys.length > 0) {
        console.log(`  ${namespace} (${locale}): ${keys.length} missing keys`);
      }
    }
  }
  
  // Traductions vides
  console.log('\n⚠️  Empty Translations:');
  for (const [namespace, locales] of Object.entries(issues.emptyTranslations)) {
    for (const [locale, keys] of Object.entries(locales)) {
      if (keys.length > 0) {
        console.log(`  ${namespace} (${locale}): ${keys.length} empty translations`);
      }
    }
  }
  
  // Statistiques
  console.log('\n📈 Statistics:');
  console.log(`  Total namespaces: ${allNamespaces.size}`);
  console.log(`  Total issues found: ${totalIssues}`);
  
  // Sauvegarder le rapport
  const report = {
    timestamp: new Date().toISOString(),
    statistics: {
      totalNamespaces: allNamespaces.size,
      totalIssues
    },
    issues
  };
  
  const reportPath = path.join(__dirname, '../translation-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return totalIssues === 0;
}

// Fonction utilitaire pour obtenir une valeur imbriquée
function getNestedValue(obj, key) {
  const keys = key.split('.');
  let current = obj;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// Fonction pour nettoyer les traductions vides
function cleanEmptyTranslations() {
  console.log('🧹 Cleaning empty translations...\n');
  
  let cleanedCount = 0;
  
  for (const locale of locales) {
    const localeDir = path.join(baseDir, locale);
    
    if (fs.existsSync(localeDir)) {
      const files = fs.readdirSync(localeDir).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(localeDir, file);
        const data = readJsonFile(filePath);
        
        const cleanedData = removeEmptyValues(data);
        
        if (JSON.stringify(data) !== JSON.stringify(cleanedData)) {
          fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2));
          console.log(`✅ Cleaned ${filePath}`);
          cleanedCount++;
        }
      }
    }
  }
  
  console.log(`\n🧹 Cleaned ${cleanedCount} files`);
}

// Fonction pour supprimer les valeurs vides d'un objet
function removeEmptyValues(obj) {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleaned = removeEmptyValues(value);
        if (Object.keys(cleaned).length > 0) {
          result[key] = cleaned;
        }
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

// Fonction principale
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'verify':
      const isClean = verifyTranslations();
      process.exit(isClean ? 0 : 1);
      break;
      
    case 'clean':
      cleanEmptyTranslations();
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/verify-translations.cjs verify  - Verify translations');
      console.log('  node scripts/verify-translations.cjs clean   - Clean empty translations');
      break;
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { verifyTranslations, cleanEmptyTranslations };
