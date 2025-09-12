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

// Fonction pour migrer un fichier
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Remplacements pour les imports
  const importReplacements = [
    {
      from: /import\s*{\s*useTranslation\s*}\s*from\s*['"]react-i18next['"];?/g,
      to: "import { useTranslations } from 'next-intl';"
    },
    {
      from: /import\s*{\s*useTranslation\s*}\s*from\s*['"]@\/lib\/i18n\/hooks\/useTranslation['"];?/g,
      to: "import { useTranslations } from 'next-intl';"
    },
    {
      from: /import\s*{\s*useTranslation\s*}\s*from\s*['"]@\/lib\/hooks\/useTranslation['"];?/g,
      to: "import { useTranslations } from 'next-intl';"
    }
  ];

  // Appliquer les remplacements d'imports
  importReplacements.forEach(replacement => {
    if (replacement.from.test(content)) {
      content = content.replace(replacement.from, replacement.to);
      hasChanges = true;
    }
  });

  // Remplacements pour l'utilisation des hooks
  const hookReplacements = [
    {
      from: /const\s*{\s*t\s*}\s*=\s*useTranslation\(\s*\[?['"][^'"]*['"](?:\s*,\s*['"][^'"]*['"])*\]?\s*\)/g,
      to: "const t = useTranslations()"
    },
    {
      from: /const\s*{\s*t\s*}\s*=\s*useTranslation\(\s*['"][^'"]*['"]\s*\)/g,
      to: "const t = useTranslations()"
    },
    {
      from: /const\s*{\s*t\s*}\s*=\s*useTranslation\(\)/g,
      to: "const t = useTranslations()"
    }
  ];

  // Appliquer les remplacements de hooks
  hookReplacements.forEach(replacement => {
    if (replacement.from.test(content)) {
      content = content.replace(replacement.from, replacement.to);
      hasChanges = true;
    }
  });

  // Remplacements pour les appels de traduction
  const translationCallReplacements = [
    // t('namespace:key') -> t('namespace.key')
    {
      from: /t\(\s*['"]([^'"]+):([^'"]+)['"]\s*\)/g,
      to: "t('$1.$2')"
    },
    // t('key', { ns: 'namespace' }) -> t('namespace.key')
    {
      from: /t\(\s*['"]([^'"]+)['"],\s*{\s*ns:\s*['"]([^'"]+)['"]\s*}\s*\)/g,
      to: "t('$2.$1')"
    }
  ];

  // Appliquer les remplacements d'appels de traduction
  translationCallReplacements.forEach(replacement => {
    if (replacement.from.test(content)) {
      content = content.replace(replacement.from, replacement.to);
      hasChanges = true;
    }
  });

  // Sauvegarder le fichier s'il y a des changements
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migré: ${filePath}`);
    return true;
  }
  
  return false;
}

// Dossiers à migrer
const dirsToMigrate = [
  'app',
  'components'
];

let totalFiles = 0;
let migratedFiles = 0;

console.log('🚀 Début de la migration vers next-intl...\n');

dirsToMigrate.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`📁 Migration du dossier: ${dir}`);
    walkDir(dir, (filePath) => {
      totalFiles++;
      if (migrateFile(filePath)) {
        migratedFiles++;
      }
    });
  }
});

console.log(`\n🎉 Migration terminée !`);
console.log(`📊 Statistiques:`);
console.log(`   - Fichiers analysés: ${totalFiles}`);
console.log(`   - Fichiers migrés: ${migratedFiles}`);
console.log(`   - Fichiers non modifiés: ${totalFiles - migratedFiles}`);