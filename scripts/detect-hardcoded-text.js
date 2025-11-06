#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script pour détecter le texte en dur dans les composants
 */
console.log('🔍 Détection du texte en dur dans les composants...\n');

// Textes problématiques identifiés dans l'interface
const problematicTexts = [
  'Loft Details',
  'Audit History', 
  'Informations sur l\'appartement',
  'Prix par nuit',
  'Propriétaire',
  'Type de propriété',
  'Société',
  'Description',
  'Disponible',
  'Modifier l\'appartement',
  'معرض الصور',
  'معلومات إضافية',
  'تم الإنشاء في',
  'آخر تحديث',
  'إدارة الفواتير',
  'المياه',
  'الكهرباء',
  'الغاز',
  'الهاتف',
  'الإنترنت',
  'لم يتم تعيين تردد',
  'غير محدد',
  'الفواتير القادمة',
  'لم يتم تعيين تواريخ استحقاق الفواتير',
  'قم بتعديل الشقة لإضافة ترددات الفواتير وتواريخ الاستحقاق'
];

// Fonction pour scanner un fichier
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    problematicTexts.forEach(text => {
      // Chercher le texte en dur (pas dans les commentaires)
      const regex = new RegExp(`["'\`]${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\`]`, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const lines = content.substring(0, match.index).split('\n');
        const lineNumber = lines.length;
        const lineContent = lines[lineNumber - 1].trim();
        
        // Ignorer les commentaires
        if (!lineContent.startsWith('//') && !lineContent.startsWith('*')) {
          issues.push({
            text: text,
            line: lineNumber,
            context: lineContent
          });
        }
      }
    });
    
    return issues;
  } catch (error) {
    return [];
  }
}

// Scanner tous les fichiers de composants
function scanDirectory(dir) {
  const results = [];
  
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      results.push(...scanDirectory(fullPath));
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      const issues = scanFile(fullPath);
      if (issues.length > 0) {
        results.push({
          file: fullPath,
          issues: issues
        });
      }
    }
  });
  
  return results;
}

// Scanner les répertoires de composants
const directories = ['components', 'app', 'pages'];
let allIssues = [];

directories.forEach(dir => {
  console.log(`🔍 Scan de ${dir}/...`);
  const issues = scanDirectory(dir);
  allIssues.push(...issues);
});

// Afficher les résultats
console.log(`\n📊 Résultats du scan:`);
console.log(`   Fichiers avec du texte en dur: ${allIssues.length}`);

let totalIssues = 0;
allIssues.forEach(fileResult => {
  totalIssues += fileResult.issues.length;
});

console.log(`   Total de textes en dur détectés: ${totalIssues}\n`);

if (allIssues.length > 0) {
  console.log('🚨 Fichiers problématiques:\n');
  
  allIssues.forEach(fileResult => {
    console.log(`📁 ${fileResult.file}`);
    
    fileResult.issues.forEach(issue => {
      console.log(`   Ligne ${issue.line}: "${issue.text}"`);
      console.log(`   Contexte: ${issue.context.substring(0, 100)}${issue.context.length > 100 ? '...' : ''}`);
      console.log('');
    });
  });
  
  // Générer des recommandations
  console.log('💡 Recommandations de correction:\n');
  
  const textToKeyMap = {
    'Loft Details': 'lofts.details.title',
    'Audit History': 'lofts.details.auditHistory',
    'Informations sur l\'appartement': 'lofts.details.apartmentInfo',
    'Prix par nuit': 'lofts.details.pricePerNight',
    'Propriétaire': 'lofts.details.owner',
    'Type de propriété': 'lofts.details.propertyType',
    'Société': 'common.company',
    'Description': 'lofts.details.description',
    'Disponible': 'common.available',
    'Modifier l\'appartement': 'lofts.details.edit'
  };
  
  Object.entries(textToKeyMap).forEach(([text, key]) => {
    console.log(`   "${text}" → t('${key}')`);
  });
  
  console.log('\n🔧 Pour corriger automatiquement:');
  console.log('   1. Remplacer le texte en dur par des appels à useTranslations()');
  console.log('   2. Ajouter les clés de traduction manquantes');
  console.log('   3. Vérifier que les composants utilisent le bon namespace');
  
} else {
  console.log('✅ Aucun texte en dur détecté dans les fichiers scannés');
}

// Sauvegarder le rapport
const report = {
  timestamp: new Date().toISOString(),
  totalFiles: allIssues.length,
  totalIssues: totalIssues,
  issues: allIssues
};

const reportPath = 'hardcoded-text-report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);
console.log('\n✨ Scan terminé !');