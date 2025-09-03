#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🤖 Migration automatique des composants restants...');

// 1. Identifier les composants qui utilisent encore react-i18next
console.log('\n1. Identification des composants à migrer...');

let componentsToMigrate = [];
try {
  const result = execSync('powershell "Get-ChildItem -Path components,app -Include *.tsx -Recurse | Select-String \\"react-i18next\\" | Select-Object -ExpandProperty Path | Get-Unique"', { encoding: 'utf8' });
  componentsToMigrate = result.trim().split('\n').filter(path => path.trim());
  console.log(`   📊 ${componentsToMigrate.length} composants à migrer`);
} catch (error) {
  console.log('   ✅ Aucun composant à migrer trouvé');
}

// 2. Fonction de migration automatique
function migrateComponent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remplacer l'import react-i18next par next-intl
    if (content.includes("import { useTranslation } from 'react-i18next'")) {
      content = content.replace("import { useTranslation } from 'react-i18next'", "import { useTranslations } from 'next-intl'");
      modified = true;
    }
    
    if (content.includes('import { useTranslation } from "react-i18next"')) {
      content = content.replace('import { useTranslation } from "react-i18next"', 'import { useTranslations } from "next-intl"');
      modified = true;
    }
    
    // Remplacer les patterns de useTranslation courants
    const useTranslationPatterns = [
      /const\s+{\s*t\s*}\s*=\s*useTranslation\(\s*\)/g,
      /const\s+{\s*t\s*}\s*=\s*useTranslation\(\s*'([^']+)'\s*\)/g,
      /const\s+{\s*t\s*}\s*=\s*useTranslation\(\s*\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]\s*\)/g,
      /const\s+{\s*t\s*}\s*=\s*useTranslation\(\s*\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\]\s*\)/g
    ];
    
    useTranslationPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        // Pour les cas simples, remplacer par useTranslations
        content = content.replace(pattern, (match, namespace1, namespace2, namespace3) => {
          if (!namespace1) {
            return "const t = useTranslations()";
          } else if (!namespace2) {
            return `const t = useTranslations('${namespace1}')`;
          } else if (!namespace3) {
            return `const t = useTranslations('${namespace1}')\n  const t${capitalize(namespace2)} = useTranslations('${namespace2}')`;
          } else {
            return `const t = useTranslations('${namespace1}')\n  const t${capitalize(namespace2)} = useTranslations('${namespace2}')\n  const t${capitalize(namespace3)} = useTranslations('${namespace3}')`;
          }
        });
        modified = true;
      }
    });
    
    // Remplacer les appels de traduction avec namespace
    const namespaces = ['common', 'auth', 'dashboard', 'lofts', 'transactions', 'navigation', 'forms', 'teams', 'tasks', 'reservations', 'reports', 'bills', 'landing', 'internetConnections', 'zoneAreas', 'paymentMethods'];
    
    namespaces.forEach(namespace => {
      const pattern = new RegExp(`t\\('${namespace}:`, 'g');
      if (pattern.test(content)) {
        if (namespace === 'common') {
          content = content.replace(pattern, "tCommon('");
        } else {
          content = content.replace(pattern, "t('");
        }
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`   ❌ Erreur lors de la migration de ${filePath}: ${error.message}`);
    return false;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 3. Migrer les composants
console.log('\n2. Migration des composants...');

let migratedCount = 0;
let errorCount = 0;

componentsToMigrate.forEach(filePath => {
  if (filePath.trim()) {
    console.log(`   🔄 Migration de ${filePath}...`);
    if (migrateComponent(filePath.trim())) {
      migratedCount++;
      console.log(`   ✅ ${filePath} migré avec succès`);
    } else {
      errorCount++;
      console.log(`   ⚠️  ${filePath} nécessite une migration manuelle`);
    }
  }
});

console.log(`\n📊 Résultats de la migration automatique:`);
console.log(`   ✅ ${migratedCount} composants migrés automatiquement`);
console.log(`   ⚠️  ${errorCount} composants nécessitent une migration manuelle`);

// 4. Vérification post-migration
console.log('\n3. Vérification post-migration...');

try {
  const remainingResult = execSync('powershell "(Get-ChildItem -Path components,app -Include *.tsx -Recurse | Select-String \\"react-i18next\\").Count"', { encoding: 'utf8' });
  const remainingCount = parseInt(remainingResult.trim()) || 0;
  
  console.log(`   📊 ${remainingCount} références à react-i18next restantes`);
  
  if (remainingCount === 0) {
    console.log('   🎉 Tous les composants ont été migrés avec succès !');
  } else {
    console.log('   ⚠️  Certains composants nécessitent une migration manuelle');
  }
} catch (error) {
  console.log('   ❌ Erreur lors de la vérification post-migration');
}

console.log('\n🤖 Migration automatique terminée!');