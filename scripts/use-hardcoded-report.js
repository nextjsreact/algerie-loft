#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script pour utiliser le rapport hardcoded-text-report.json et corriger les fichiers
 */
console.log('🔧 Utilisation du rapport hardcoded-text-report.json...\n');

// Charger le rapport
let report;
try {
  const reportContent = fs.readFileSync('hardcoded-text-report.json', 'utf8');
  report = JSON.parse(reportContent);
  console.log(`📊 Rapport chargé: ${report.totalFiles} fichiers, ${report.totalIssues} problèmes`);
} catch (error) {
  console.error('❌ Impossible de charger le rapport:', error.message);
  console.log('💡 Exécutez d\'abord: node scripts/detect-hardcoded-text.js');
  process.exit(1);
}

// Mapping des textes en dur vers les clés de traduction
const textToTranslationKey = {
  // Français
  'Disponible': 'common.available',
  'Type de propriété': 'lofts.details.propertyType',
  'Description': 'lofts.details.description',
  'Propriétaire': 'lofts.details.owner',
  
  // Arabe
  'الهاتف': 'bills.management.phone',
  'المياه': 'bills.management.water',
  'الكهرباء': 'bills.management.electricity',
  'الغاز': 'bills.management.gas',
  'الإنترنت': 'bills.management.internet',
  'معرض الصور': 'lofts.details.gallery',
  'معلومات إضافية': 'lofts.details.additionalInfo',
  'تم الإنشاء في': 'lofts.details.createdAt',
  'آخر تحديث': 'lofts.details.lastUpdated',
  'إدارة الفواتير': 'bills.management.title',
  'غير محدد': 'bills.frequency.undefined',
  'الفواتير القادمة': 'bills.upcomingBills'
};

// Analyser les problèmes par priorité
console.log('\n🔍 Analyse des problèmes par priorité...\n');

// 1. Fichiers les plus problématiques
const fileProblems = {};
report.issues.forEach(fileIssue => {
  fileProblems[fileIssue.file] = fileIssue.issues.length;
});

const sortedFiles = Object.entries(fileProblems)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5);

console.log('📁 Top 5 des fichiers les plus problématiques:');
sortedFiles.forEach(([file, count]) => {
  console.log(`   ${count} problèmes: ${file}`);
});

// 2. Textes les plus fréquents
const textFrequency = {};
report.issues.forEach(fileIssue => {
  fileIssue.issues.forEach(issue => {
    textFrequency[issue.text] = (textFrequency[issue.text] || 0) + 1;
  });
});

const sortedTexts = Object.entries(textFrequency)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);

console.log('\n📝 Top 10 des textes en dur les plus fréquents:');
sortedTexts.forEach(([text, count]) => {
  const translationKey = textToTranslationKey[text];
  console.log(`   ${count}x "${text}" ${translationKey ? `→ t('${translationKey}')` : '(pas de mapping)'}`);
});

// 3. Générer des corrections suggérées
console.log('\n💡 Corrections suggérées par fichier:\n');

report.issues.forEach(fileIssue => {
  const corrections = fileIssue.issues.filter(issue => textToTranslationKey[issue.text]);
  
  if (corrections.length > 0) {
    console.log(`📁 ${fileIssue.file}:`);
    corrections.forEach(issue => {
      const translationKey = textToTranslationKey[issue.text];
      console.log(`   Ligne ${issue.line}: "${issue.text}" → t('${translationKey}')`);
    });
    console.log('');
  }
});

// 4. Générer un script de correction automatique
console.log('🔧 Génération d\'un script de correction automatique...\n');

const autoFixScript = `#!/usr/bin/env node

import fs from 'fs';

/**
 * Script de correction automatique généré à partir du rapport
 */

const corrections = ${JSON.stringify(textToTranslationKey, null, 2)};

const filesToFix = ${JSON.stringify(report.issues.map(f => f.file), null, 2)};

console.log('🔧 Correction automatique des textes en dur...');

filesToFix.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    Object.entries(corrections).forEach(([hardcodedText, translationKey]) => {
      const escapedText = hardcodedText.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      const regex = new RegExp('["\\'\\`]' + escapedText + '["\\'\\`]', 'g');
      if (regex.test(content)) {
        content = content.replace(regex, "t('" + translationKey + "')");
        modified = true;
        console.log('✅ ' + filePath + ': "' + hardcodedText + '" → t(\\''+translationKey+'\\')');
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('💾 ' + filePath + ' sauvegardé');
    }
  } catch (error) {
    console.error('❌ Erreur avec ' + filePath + ':', error.message);
  }
});

console.log('✨ Correction automatique terminée !');
`;

fs.writeFileSync('scripts/auto-fix-from-report.js', autoFixScript);
console.log('📄 Script de correction automatique créé: scripts/auto-fix-from-report.js');

// 5. Instructions d'utilisation
console.log('\n📋 INSTRUCTIONS D\'UTILISATION:\n');

console.log('**Option 1 - Correction automatique:**');
console.log('   node scripts/auto-fix-from-report.js');
console.log('   (Attention: sauvegardez vos fichiers avant!)');

console.log('\n**Option 2 - Correction manuelle:**');
console.log('   1. Ouvrez chaque fichier listé dans le rapport');
console.log('   2. Allez à la ligne indiquée');
console.log('   3. Remplacez le texte en dur par t(\'clé.de.traduction\')');
console.log('   4. Ajoutez useTranslations() si nécessaire');

console.log('\n**Option 3 - Correction ciblée:**');
console.log('   1. Concentrez-vous sur les fichiers avec le plus de problèmes');
console.log('   2. Corrigez d\'abord les textes les plus fréquents');
console.log('   3. Testez après chaque correction');

console.log('\n**Vérification:**');
console.log('   node scripts/final-validation.js');

console.log('\n⚠️  **IMPORTANT:**');
console.log('   - Sauvegardez vos fichiers avant la correction automatique');
console.log('   - Vérifiez que les composants utilisent useTranslations()');
console.log('   - Testez l\'application après les corrections');

console.log('\n✨ Utilisation du rapport terminée !');