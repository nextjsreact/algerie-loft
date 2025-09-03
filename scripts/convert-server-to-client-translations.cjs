const fs = require('fs');
const path = require('path');

// Configuration
const appDir = path.join(__dirname, '../app');
const componentsDir = path.join(__dirname, '../components');

// Fonction pour lire un fichier
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error.message);
  }
}

// Fonction pour analyser un fichier et identifier les traductions côté serveur
function analyzeFile(filePath) {
  const content = readFile(filePath);
  if (!content) return null;

  const issues = [];
  
  // Vérifier l'utilisation de getTranslations côté serveur
  if (content.includes('getTranslations') && content.includes('await')) {
    issues.push('Uses server-side getTranslations');
  }
  
  // Vérifier l'utilisation de t() avec des props
  if (content.includes('translations:') && content.includes('t(')) {
    issues.push('Uses translations passed as props');
  }
  
  // Vérifier l'absence de useTranslation côté client
  if (content.includes('"use client"') && !content.includes('useTranslation')) {
    if (content.includes('t(') || content.includes('translations')) {
      issues.push('Client component without useTranslation hook');
    }
  }

  return issues.length > 0 ? { filePath, issues } : null;
}

// Fonction pour corriger un fichier
function fixFile(filePath) {
  const content = readFile(filePath);
  if (!content) return false;

  let updatedContent = content;
  let hasChanges = false;

  // Remplacer getTranslations côté serveur par useTranslation côté client
  if (content.includes('getTranslations') && content.includes('await')) {
    // Ajouter l'import useTranslation
    if (!content.includes("import { useTranslation }")) {
      updatedContent = updatedContent.replace(
        /import.*from.*["']@\/lib\/i18n\/server["']/g,
        'import { useTranslation } from "@/lib/i18n/context"'
      );
    }

    // Remplacer la fonction getTranslations par le hook useTranslation
    updatedContent = updatedContent.replace(
      /const t = await getTranslations\(\)/g,
      'const { t } = useTranslation()'
    );

    // Ajouter "use client" si nécessaire
    if (!content.includes('"use client"')) {
      updatedContent = '"use client"\n\n' + updatedContent;
    }

    hasChanges = true;
  }

  // Supprimer les props de traductions passées aux composants
  if (content.includes('translations: {')) {
    // Trouver et supprimer les objets de traductions passés en props
    const translationsRegex = /translations:\s*\{[\s\S]*?\}/g;
    updatedContent = updatedContent.replace(translationsRegex, '');
    
    // Nettoyer les virgules en trop
    updatedContent = updatedContent.replace(/,\s*,/g, ',');
    updatedContent = updatedContent.replace(/,\s*}/g, '}');
    
    hasChanges = true;
  }

  if (hasChanges) {
    writeFile(filePath, updatedContent);
    return true;
  }

  return false;
}

// Fonction principale
function convertServerToClientTranslations() {
  console.log('🔧 Converting server-side translations to client-side...');

  const filesToCheck = [
    // Pages principales
    'app/transactions/page.tsx',
    'app/reports/page.tsx',
    'app/owners/page.tsx',
    'app/lofts/[id]/edit/page.tsx',
    
    // Composants
    'app/lofts/lofts-list.tsx', // Déjà corrigé
    'components/transactions/transactions-list.tsx',
    'components/dashboard/dashboard-wrapper.tsx',
    
    // Autres composants potentiels
    'app/tasks/page.tsx',
    'app/teams/page.tsx',
    'app/settings/page.tsx',
    'app/conversations/page.tsx'
  ];

  let totalIssues = 0;
  let totalFixed = 0;

  filesToCheck.forEach(relativePath => {
    const filePath = path.join(__dirname, '..', relativePath);
    
    if (fs.existsSync(filePath)) {
      console.log(`\n📝 Checking: ${relativePath}`);
      
      const issues = analyzeFile(filePath);
      if (issues) {
        console.log(`⚠️ Issues found:`);
        issues.issues.forEach(issue => {
          console.log(`   - ${issue}`);
          totalIssues++;
        });
        
        // Essayer de corriger le fichier
        if (fixFile(filePath)) {
          console.log(`✅ Fixed: ${relativePath}`);
          totalFixed++;
        }
      } else {
        console.log(`✅ No issues found`);
      }
    } else {
      console.log(`❌ File not found: ${relativePath}`);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   - Total issues found: ${totalIssues}`);
  console.log(`   - Files fixed: ${totalFixed}`);
  console.log(`   - Files checked: ${filesToCheck.length}`);
}

// Exécuter le script
convertServerToClientTranslations();

