#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('📋 Génération du rapport de migration i18next vers next-intl...');

const report = {
  timestamp: new Date().toISOString(),
  status: 'EN_COURS',
  summary: {},
  details: {},
  recommendations: []
};

// 1. Analyse des composants migrés
console.log('\n1. Analyse des composants...');

try {
  const reactI18nextCount = execSync('powershell "(Get-ChildItem -Path components,app -Include *.tsx -Recurse | Select-String \\"react-i18next\\").Count"', { encoding: 'utf8' });
  const useTranslationsCount = execSync('powershell "(Get-ChildItem -Path components,app -Include *.tsx -Recurse | Select-String \\"useTranslations\\").Count"', { encoding: 'utf8' });
  
  report.summary.componentsWithReactI18next = parseInt(reactI18nextCount.trim()) || 0;
  report.summary.componentsWithNextIntl = parseInt(useTranslationsCount.trim()) || 0;
  
  const totalComponents = report.summary.componentsWithReactI18next + report.summary.componentsWithNextIntl;
  const migrationProgress = totalComponents > 0 ? 
    Math.round((report.summary.componentsWithNextIntl / totalComponents) * 100) : 0;
  
  report.summary.migrationProgress = `${migrationProgress}%`;
  
  console.log(`   📊 Composants avec react-i18next: ${report.summary.componentsWithReactI18next}`);
  console.log(`   📊 Composants avec next-intl: ${report.summary.componentsWithNextIntl}`);
  console.log(`   📊 Progression de la migration: ${report.summary.migrationProgress}`);
  
} catch (error) {
  console.log('   ❌ Erreur lors de l\'analyse des composants');
  report.summary.error = error.message;
}

// 2. Analyse des traductions
console.log('\n2. Analyse des traductions...');

const locales = ['fr', 'en', 'ar'];
report.details.translations = {};

locales.forEach(locale => {
  try {
    const content = fs.readFileSync(`messages/${locale}.json`, 'utf8');
    const messages = JSON.parse(content);
    const keyCount = countKeys(messages);
    const fileSize = fs.statSync(`messages/${locale}.json`).size;
    
    report.details.translations[locale] = {
      keyCount,
      fileSizeKB: Math.round(fileSize / 1024 * 100) / 100,
      status: 'OK'
    };
    
    console.log(`   ✅ ${locale}: ${keyCount} clés, ${report.details.translations[locale].fileSizeKB} KB`);
  } catch (error) {
    report.details.translations[locale] = {
      status: 'ERROR',
      error: error.message
    };
    console.log(`   ❌ ${locale}: Erreur`);
  }
});

// 3. Vérification de la configuration
console.log('\n3. Vérification de la configuration...');

report.details.configuration = {
  i18nConfig: fs.existsSync('i18n.ts'),
  middleware: fs.existsSync('middleware.ts'),
  nextConfig: fs.existsSync('next.config.mjs'),
  localizedRoutes: fs.existsSync('app/[locale]')
};

Object.entries(report.details.configuration).forEach(([key, exists]) => {
  console.log(`   ${exists ? '✅' : '❌'} ${key}: ${exists ? 'Présent' : 'Manquant'}`);
});

// 4. Vérification des dépendances
console.log('\n4. Vérification des dépendances...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const oldDeps = ['i18next', 'react-i18next', 'i18next-browser-languagedetector'];
  const newDeps = ['next-intl'];
  
  report.details.dependencies = {
    oldDependenciesRemoved: oldDeps.every(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    ),
    newDependenciesInstalled: newDeps.every(dep => 
      packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
    )
  };
  
  console.log(`   ${report.details.dependencies.oldDependenciesRemoved ? '✅' : '❌'} Anciennes dépendances supprimées`);
  console.log(`   ${report.details.dependencies.newDependenciesInstalled ? '✅' : '❌'} Nouvelles dépendances installées`);
  
} catch (error) {
  console.log('   ❌ Erreur lors de la vérification des dépendances');
}

// 5. Recommandations
console.log('\n5. Génération des recommandations...');

if (report.summary.componentsWithReactI18next > 0) {
  report.recommendations.push({
    priority: 'HIGH',
    type: 'MIGRATION',
    message: `${report.summary.componentsWithReactI18next} composants utilisent encore react-i18next et doivent être migrés`
  });
}

if (!report.details.configuration.i18nConfig) {
  report.recommendations.push({
    priority: 'HIGH',
    type: 'CONFIGURATION',
    message: 'Le fichier de configuration i18n.ts est manquant'
  });
}

if (!report.details.dependencies.oldDependenciesRemoved) {
  report.recommendations.push({
    priority: 'MEDIUM',
    type: 'CLEANUP',
    message: 'Les anciennes dépendances i18next doivent être supprimées'
  });
}

// Vérifier la cohérence des traductions
const frKeys = report.details.translations.fr?.keyCount || 0;
const enKeys = report.details.translations.en?.keyCount || 0;
const arKeys = report.details.translations.ar?.keyCount || 0;

if (Math.abs(frKeys - enKeys) > 10 || Math.abs(frKeys - arKeys) > 10) {
  report.recommendations.push({
    priority: 'MEDIUM',
    type: 'TRANSLATIONS',
    message: 'Incohérences détectées dans le nombre de clés de traduction entre les langues'
  });
}

// 6. Déterminer le statut global
if (report.summary.componentsWithReactI18next === 0 && 
    report.details.configuration.i18nConfig && 
    report.details.dependencies.newDependenciesInstalled) {
  report.status = 'COMPLETE';
} else if (report.summary.componentsWithNextIntl > 0) {
  report.status = 'EN_COURS';
} else {
  report.status = 'NON_COMMENCE';
}

// 7. Sauvegarder le rapport
const reportPath = 'migration-report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n📋 Rapport généré: ${reportPath}`);
console.log(`📊 Statut de la migration: ${report.status}`);
console.log(`📊 Progression: ${report.summary.migrationProgress}`);

if (report.recommendations.length > 0) {
  console.log(`\n⚠️  ${report.recommendations.length} recommandations:`);
  report.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. [${rec.priority}] ${rec.message}`);
  });
}

console.log('\n🎉 Rapport de migration terminé!');

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