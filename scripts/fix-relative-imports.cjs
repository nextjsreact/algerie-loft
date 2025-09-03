const fs = require('fs');
const path = require('path');

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      callback(filePath);
    }
  });
}

// Fonction pour corriger les imports dans un fichier
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Corrections spécifiques pour les imports relatifs
  const importFixes = [
    // Actions
    {
      from: /from\s*['"]\.\.\/actions\/([^'"]+)['"]/g,
      to: "from '@/app/actions/$1'"
    },
    {
      from: /from\s*['"]\.\.\/\.\.\/actions\/([^'"]+)['"]/g,
      to: "from '@/app/actions/$1'"
    },
    {
      from: /from\s*['"]\.\.\/\.\.\/\.\.\/actions\/([^'"]+)['"]/g,
      to: "from '@/app/actions/$1'"
    },
    
    // Components locaux
    {
      from: /from\s*['"]\.\/components\/([^'"]+)['"]/g,
      to: "from '@/app/settings/currencies/components/$1'"
    },
    {
      from: /from\s*['"]\.\/delete-button['"]/g,
      to: "from '@/app/owners/[id]/delete-button'"
    },
    {
      from: /from\s*['"]\.\/new-loft-form['"]/g,
      to: "from '@/app/lofts/new/new-loft-form'"
    },
    
    // Autres corrections communes
    {
      from: /from\s*['"]\.\.\/([^'"]+)['"]/g,
      to: (match, p1) => {
        // Si c'est un composant, utiliser le chemin absolu
        if (p1.includes('components/') || p1.includes('forms/')) {
          return `from '@/${p1}'`;
        }
        return match;
      }
    }
  ];

  // Appliquer les corrections
  importFixes.forEach(fix => {
    if (typeof fix.to === 'function') {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        hasChanges = true;
      }
    } else {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        hasChanges = true;
      }
    }
  });

  // Corrections spécifiques par fichier
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  
  // Corrections pour les pages de settings/currencies
  if (dirName.includes('settings/currencies')) {
    content = content.replace(
      /from\s*['"]\.\/components\/client['"]/g,
      "from '@/app/settings/currencies/components/client'"
    );
    hasChanges = true;
  }
  
  // Corrections pour les pages tasks/[id]
  if (dirName.includes('tasks/[id]')) {
    content = content.replace(
      /from\s*['"]\.\/delete-button['"]/g,
      "from '@/app/tasks/[id]/delete-button'"
    );
    hasChanges = true;
  }

  // Sauvegarder le fichier s'il y a des changements
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigé: ${filePath}`);
    return true;
  }
  
  return false;
}

// Corriger les imports dans le dossier [locale]
const localeDir = 'app/[locale]';
let totalFiles = 0;
let fixedFiles = 0;

console.log('🔧 Correction des imports relatifs...\n');

if (fs.existsSync(localeDir)) {
  walkDir(localeDir, (filePath) => {
    totalFiles++;
    if (fixImports(filePath)) {
      fixedFiles++;
    }
  });
}

console.log(`\n🎉 Correction terminée !`);
console.log(`📊 Statistiques:`);
console.log(`   - Fichiers analysés: ${totalFiles}`);
console.log(`   - Fichiers corrigés: ${fixedFiles}`);
console.log(`   - Fichiers non modifiés: ${totalFiles - fixedFiles}`);