const fs = require('fs');
const path = require('path');

// Pages principales à migrer
const pagesToMigrate = [
  'lofts',
  'owners', 
  'teams',
  'tasks',
  'transactions',
  'reservations',
  'reports',
  'dashboard',
  'conversations',
  'notifications',
  'settings',
  'availability',
  'executive'
];

// Créer les dossiers et pages pour chaque locale
pagesToMigrate.forEach(page => {
  const sourcePagePath = path.join('app', page, 'page.tsx');
  const targetPagePath = path.join('app', '[locale]', page, 'page.tsx');
  const targetDir = path.dirname(targetPagePath);
  
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copier la page si elle existe
  if (fs.existsSync(sourcePagePath)) {
    const content = fs.readFileSync(sourcePagePath, 'utf8');
    fs.writeFileSync(targetPagePath, content);
    console.log(`✅ Créé: ${targetPagePath}`);
  } else {
    console.log(`⚠️  Page source non trouvée: ${sourcePagePath}`);
  }
});

// Pages avec sous-routes
const pagesWithSubroutes = [
  { page: 'lofts', subroutes: ['new', '[id]', '[id]/edit'] },
  { page: 'owners', subroutes: ['new', '[id]', '[id]/edit'] },
  { page: 'teams', subroutes: ['new', '[id]', '[id]/edit'] },
  { page: 'tasks', subroutes: ['new', '[id]', '[id]/edit'] },
  { page: 'transactions', subroutes: ['new', '[id]', '[id]/edit'] },
  { page: 'conversations', subroutes: ['new', '[id]'] },
  { page: 'settings', subroutes: ['categories', 'currencies', 'payment-methods', 'zone-areas', 'internet-connections'] }
];

pagesWithSubroutes.forEach(({ page, subroutes }) => {
  subroutes.forEach(subroute => {
    const sourcePagePath = path.join('app', page, subroute, 'page.tsx');
    const targetPagePath = path.join('app', '[locale]', page, subroute, 'page.tsx');
    const targetDir = path.dirname(targetPagePath);
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copier la page si elle existe
    if (fs.existsSync(sourcePagePath)) {
      const content = fs.readFileSync(sourcePagePath, 'utf8');
      fs.writeFileSync(targetPagePath, content);
      console.log(`✅ Créé: ${targetPagePath}`);
    }
  });
});

console.log('🎉 Création des pages locale terminée !');