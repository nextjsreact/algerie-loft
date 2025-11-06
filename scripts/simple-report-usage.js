#!/usr/bin/env node

import fs from 'fs';

/**
 * Script simple pour utiliser le rapport hardcoded-text-report.json
 */
console.log('📋 Utilisation simple du rapport hardcoded-text-report.json\n');

// Charger le rapport
let report;
try {
  const reportContent = fs.readFileSync('hardcoded-text-report.json', 'utf8');
  report = JSON.parse(reportContent);
  console.log(`📊 Rapport chargé: ${report.totalFiles} fichiers, ${report.totalIssues} problèmes\n`);
} catch (error) {
  console.error('❌ Impossible de charger le rapport:', error.message);
  console.log('💡 Exécutez d\'abord: node scripts/detect-hardcoded-text.js');
  process.exit(1);
}

// Analyser les problèmes
console.log('🔍 ANALYSE DU RAPPORT:\n');

// 1. Fichiers les plus problématiques
const fileProblems = {};
report.issues.forEach(fileIssue => {
  fileProblems[fileIssue.file] = fileIssue.issues.length;
});

const sortedFiles = Object.entries(fileProblems)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5);

console.log('📁 TOP 5 - Fichiers les plus problématiques:');
sortedFiles.forEach(([file, count]) => {
  console.log(`   ${count} problèmes → ${file}`);
});

// 2. Textes les plus fréquents
const textFrequency = {};
report.issues.forEach(fileIssue => {
  fileIssue.issues.forEach(issue => {
    textFrequency[issue.text] = (textFrequency[issue.text] || 0) + 1;
  });
});

const sortedTexts = Object.entries(textFrequency)
  .sort(([,a], [,b]) => b - a);

console.log('\n📝 TEXTES EN DUR PAR FRÉQUENCE:');
sortedTexts.forEach(([text, count]) => {
  console.log(`   ${count}x → "${text}"`);
});

// 3. Détail par fichier
console.log('\n📋 DÉTAIL PAR FICHIER:\n');

report.issues.forEach(fileIssue => {
  console.log(`📁 ${fileIssue.file} (${fileIssue.issues.length} problèmes):`);
  
  fileIssue.issues.forEach(issue => {
    console.log(`   Ligne ${issue.line}: "${issue.text}"`);
    console.log(`   Contexte: ${issue.context}`);
    console.log('');
  });
});

// 4. Instructions de correction
console.log('\n💡 COMMENT CORRIGER CES PROBLÈMES:\n');

console.log('**ÉTAPE 1 - Prioriser:**');
console.log('   Commencez par les fichiers avec le plus de problèmes');
console.log('   Concentrez-vous sur les textes les plus fréquents\n');

console.log('**ÉTAPE 2 - Corriger manuellement:**');
console.log('   1. Ouvrez le fichier dans votre éditeur');
console.log('   2. Allez à la ligne indiquée');
console.log('   3. Remplacez le texte en dur par une traduction');
console.log('   4. Ajoutez useTranslations() si nécessaire\n');

console.log('**EXEMPLES DE CORRECTIONS:**');
console.log('   "Disponible" → t("available")');
console.log('   "Type de propriété" → t("propertyType")');
console.log('   "Description" → t("description")');
console.log('   "الهاتف" → t("phone")');
console.log('   "المياه" → t("water")\n');

console.log('**ÉTAPE 3 - Vérifier:**');
console.log('   node scripts/final-validation.js');
console.log('   Redémarrez l\'application et testez\n');

// 5. Créer un guide de correction spécifique
const guideContent = `# Guide de correction des textes en dur

## Fichiers prioritaires à corriger:

${sortedFiles.map(([file, count]) => `### ${file} (${count} problèmes)`).join('\n')}

## Corrections suggérées:

${sortedTexts.map(([text, count]) => {
  let suggestion = '';
  switch(text) {
    case 'Disponible': suggestion = 't("available")'; break;
    case 'Type de propriété': suggestion = 't("propertyType")'; break;
    case 'Description': suggestion = 't("description")'; break;
    case 'Propriétaire': suggestion = 't("owner")'; break;
    case 'الهاتف': suggestion = 't("phone")'; break;
    case 'المياه': suggestion = 't("water")'; break;
    case 'الكهرباء': suggestion = 't("electricity")'; break;
    case 'الغاز': suggestion = 't("gas")'; break;
    default: suggestion = 't("appropriateKey")';
  }
  return `- "${text}" (${count}x) → ${suggestion}`;
}).join('\n')}

## Instructions détaillées:

1. **Ouvrir le fichier** dans votre éditeur
2. **Aller à la ligne** indiquée dans le rapport
3. **Remplacer le texte en dur** par l'appel de traduction
4. **Ajouter useTranslations()** au début du composant si nécessaire
5. **Tester** que la traduction fonctionne

## Exemple de correction:

\`\`\`tsx
// AVANT
const status = "Disponible";

// APRÈS  
const t = useTranslations('common');
const status = t('available');
\`\`\`
`;

fs.writeFileSync('GUIDE_CORRECTION_TEXTES_EN_DUR.md', guideContent);
console.log('📄 Guide de correction créé: GUIDE_CORRECTION_TEXTES_EN_DUR.md');

console.log('\n✨ Analyse du rapport terminée !');
console.log('\n🎯 PROCHAINES ÉTAPES:');
console.log('   1. Lisez le guide: GUIDE_CORRECTION_TEXTES_EN_DUR.md');
console.log('   2. Corrigez les fichiers prioritaires');
console.log('   3. Validez: node scripts/final-validation.js');
console.log('   4. Testez votre application');