#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Validation finale de la migration next-intl...');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function addTest(name, status, message) {
  results.tests.push({ name, status, message });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'WARN') results.warnings++;
}

// Test 1: Vérifier qu'il n'y a plus de react-i18next
console.log('\n1. Test: Absence de react-i18next...');
try {
  const result = execSync('powershell "(Get-ChildItem -Path components,app -Include *.tsx -Recurse | Select-String \\"react-i18next\\").Count"', { encoding: 'utf8' });
  const count = parseInt(result.trim()) || 0;
  
  if (count === 0) {
    addTest('react-i18next-removal', 'PASS', 'Aucune référence à react-i18next trouvée');
  } else {
    addTest('react-i18next-removal', 'FAIL', `${count} références à react-i18next encore présentes`);
  }
} catch (error) {
  addTest('react-i18next-removal', 'WARN', 'Impossible de vérifier les références react-i18next');
}

// Test 2: Vérifier la présence de useTranslations
console.log('2. Test: Utilisation de useTranslations...');
try {
  const result = execSync('powershell "(Get-ChildItem -Path components,app -Include *.tsx -Recurse | Select-String \\"useTranslations\\").Count"', { encoding: 'utf8' });
  const count = parseInt(result.trim()) || 0;
  
  if (count > 0) {
    addTest('useTranslations-usage', 'PASS', `${count} utilisations de useTranslations trouvées`);
  } else {
    addTest('useTranslations-usage', 'WARN', 'Aucune utilisation de useTranslations trouvée');
  }
} catch (error) {
  addTest('useTranslations-usage', 'WARN', 'Impossible de vérifier les utilisations de useTranslations');
}

// Test 3: Vérifier les fichiers de configuration
console.log('3. Test: Configuration next-intl...');
const configFiles = [
  { file: 'i18n.ts', name: 'Configuration i18n' },
  { file: 'middleware.ts', name: 'Middleware de routage' },
  { file: 'next.config.mjs', name: 'Configuration Next.js' }
];

configFiles.forEach(({ file, name }) => {
  if (fs.existsSync(file)) {
    addTest(`config-${file}`, 'PASS', `${name} présent`);
  } else {
    addTest(`config-${file}`, 'FAIL', `${name} manquant`);
  }
});

// Test 4: Vérifier les fichiers de traduction
console.log('4. Test: Fichiers de traduction...');
const locales = ['fr', 'en', 'ar'];
locales.forEach(locale => {
  const filePath = `messages/${locale}.json`;
  if (fs.existsSync(filePath)) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const keyCount = countKeys(content);
      addTest(`translations-${locale}`, 'PASS', `${keyCount} clés de traduction`);
    } catch (error) {
      addTest(`translations-${locale}`, 'FAIL', `Fichier ${locale} invalide`);
    }
  } else {
    addTest(`translations-${locale}`, 'FAIL', `Fichier ${locale} manquant`);
  }
});

// Test 5: Vérifier les routes localisées
console.log('5. Test: Routes localisées...');
if (fs.existsSync('app/[locale]')) {
  addTest('localized-routes', 'PASS', 'Structure de routes localisées présente');
  
  // Vérifier quelques routes importantes
  const importantRoutes = ['dashboard', 'login', 'lofts'];
  importantRoutes.forEach(route => {
    if (fs.existsSync(`app/[locale]/${route}`)) {
      addTest(`route-${route}`, 'PASS', `Route /${route} localisée`);
    } else {
      addTest(`route-${route}`, 'WARN', `Route /${route} non localisée`);
    }
  });
} else {
  addTest('localized-routes', 'FAIL', 'Structure de routes localisées manquante');
}

// Test 6: Vérifier les dépendances
console.log('6. Test: Dépendances...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Vérifier que next-intl est installé
  if (packageJson.dependencies?.['next-intl']) {
    addTest('next-intl-dependency', 'PASS', 'next-intl installé');
  } else {
    addTest('next-intl-dependency', 'FAIL', 'next-intl manquant');
  }
  
  // Vérifier que les anciennes dépendances sont supprimées
  const oldDeps = ['i18next', 'react-i18next', 'i18next-browser-languagedetector'];
  const foundOldDeps = oldDeps.filter(dep => 
    packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
  );
  
  if (foundOldDeps.length === 0) {
    addTest('old-dependencies-removed', 'PASS', 'Anciennes dépendances supprimées');
  } else {
    addTest('old-dependencies-removed', 'FAIL', `Dépendances restantes: ${foundOldDeps.join(', ')}`);
  }
} catch (error) {
  addTest('dependencies-check', 'FAIL', 'Impossible de vérifier les dépendances');
}

// Test 7: Test de construction
console.log('7. Test: Construction de l\'application...');
try {
  console.log('   🔨 Construction en cours...');
  execSync('npm run build', { stdio: 'pipe' });
  addTest('build-success', 'PASS', 'Construction réussie');
} catch (error) {
  addTest('build-success', 'FAIL', 'Échec de la construction');
}

// Résultats finaux
console.log('\n📊 Résultats de la validation finale:');
console.log(`   ✅ Tests réussis: ${results.passed}`);
console.log(`   ❌ Tests échoués: ${results.failed}`);
console.log(`   ⚠️  Avertissements: ${results.warnings}`);

if (results.failed > 0) {
  console.log('\n❌ Tests échoués:');
  results.tests.filter(t => t.status === 'FAIL').forEach(test => {
    console.log(`   - ${test.name}: ${test.message}`);
  });
}

if (results.warnings > 0) {
  console.log('\n⚠️  Avertissements:');
  results.tests.filter(t => t.status === 'WARN').forEach(test => {
    console.log(`   - ${test.name}: ${test.message}`);
  });
}

// Déterminer le statut global
let globalStatus;
if (results.failed === 0 && results.warnings === 0) {
  globalStatus = '🎉 MIGRATION COMPLÈTE ET VALIDÉE';
} else if (results.failed === 0) {
  globalStatus = '✅ MIGRATION COMPLÈTE AVEC AVERTISSEMENTS';
} else {
  globalStatus = '❌ MIGRATION INCOMPLÈTE';
}

console.log(`\n${globalStatus}`);

// Sauvegarder le rapport de validation
const validationReport = {
  timestamp: new Date().toISOString(),
  status: globalStatus,
  summary: {
    passed: results.passed,
    failed: results.failed,
    warnings: results.warnings,
    total: results.tests.length
  },
  tests: results.tests
};

fs.writeFileSync('validation-report.json', JSON.stringify(validationReport, null, 2));
console.log('\n📋 Rapport de validation sauvegardé: validation-report.json');

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}