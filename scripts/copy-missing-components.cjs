const fs = require('fs');
const path = require('path');

// Composants à copier avec leurs chemins source et destination
const componentsToCopy = [
  // Tasks
  {
    source: 'app/tasks/[id]/edit/edit-task-form.tsx',
    dest: 'app/[locale]/tasks/[id]/edit/edit-task-form.tsx'
  },
  {
    source: 'app/tasks/new/new-task-form.tsx',
    dest: 'app/[locale]/tasks/new/new-task-form.tsx'
  },
  {
    source: 'app/tasks/[id]/delete-button.tsx',
    dest: 'app/[locale]/tasks/[id]/delete-button.tsx'
  },
  
  // Lofts
  {
    source: 'app/lofts/new/new-loft-form.tsx',
    dest: 'app/[locale]/lofts/new/new-loft-form.tsx'
  },
  {
    source: 'app/lofts/[id]/edit/edit-loft-form-wrapper.tsx',
    dest: 'app/[locale]/lofts/[id]/edit/edit-loft-form-wrapper.tsx'
  },
  {
    source: 'app/lofts/[id]/edit/edit-loft-page-client.tsx',
    dest: 'app/[locale]/lofts/[id]/edit/edit-loft-page-client.tsx'
  },
  {
    source: 'app/lofts/[id]/edit/delete-button.tsx',
    dest: 'app/[locale]/lofts/[id]/edit/delete-button.tsx'
  },
  
  // Owners
  {
    source: 'app/owners/[id]/delete-button.tsx',
    dest: 'app/[locale]/owners/[id]/delete-button.tsx'
  },
  
  // Settings/Currencies
  {
    source: 'app/settings/currencies/components/client.tsx',
    dest: 'app/[locale]/settings/currencies/components/client.tsx'
  },
  
  // Teams
  {
    source: 'app/teams/[id]/edit/page.tsx',
    dest: 'app/[locale]/teams/[id]/edit/page.tsx'
  },
  
  // Transactions
  {
    source: 'app/transactions/[id]/edit/page.tsx',
    dest: 'app/[locale]/transactions/[id]/edit/page.tsx'
  }
];

let copiedCount = 0;
let skippedCount = 0;

console.log('📁 Copie des composants manquants...\n');

componentsToCopy.forEach(({ source, dest }) => {
  // Créer le dossier de destination s'il n'existe pas
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copier le fichier s'il existe
  if (fs.existsSync(source)) {
    const content = fs.readFileSync(source, 'utf8');
    fs.writeFileSync(dest, content);
    console.log(`✅ Copié: ${source} → ${dest}`);
    copiedCount++;
  } else {
    console.log(`⚠️  Source non trouvée: ${source}`);
    skippedCount++;
  }
});

console.log(`\n🎉 Copie terminée !`);
console.log(`📊 Statistiques:`);
console.log(`   - Fichiers copiés: ${copiedCount}`);
console.log(`   - Fichiers non trouvés: ${skippedCount}`);