#!/usr/bin/env node

/**
 * Script pour améliorer automatiquement les placeholders dans tous les formulaires
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mappings des placeholders améliorés
const placeholderMappings = {
  // Champs de base
  'placeholder="Name"': 'placeholder="Ex: Ahmed Benali" className="placeholder:text-gray-400 placeholder:opacity-100"',
  'placeholder="Email"': 'placeholder="Ex: nom@exemple.com" className="placeholder:text-gray-400 placeholder:opacity-100"',
  'placeholder="Password"': 'placeholder="••••••••" className="placeholder:text-gray-400 placeholder:opacity-100"',
  'placeholder="Phone"': 'placeholder="Ex: +213 555 123 456" className="placeholder:text-gray-400 placeholder:opacity-100"',
  'placeholder="Address"': 'placeholder="Ex: 123 Rue Didouche Mourad, Alger" className="placeholder:text-gray-400 placeholder:opacity-100"',
  
  // Champs de date
  'type="date"': 'type="date" placeholder="jj/mm/aaaa" className="placeholder:text-gray-400 placeholder:opacity-100"',
  
  // Champs numériques
  'type="number"': 'type="number" className="placeholder:text-gray-400 placeholder:opacity-100"',
  
  // Sélecteurs
  'placeholder="Select option"': 'placeholder="Sélectionner une option"',
  'placeholder="Select an option"': 'placeholder="Sélectionner une option"',
  
  // Champs spécifiques
  'placeholder="Description"': 'placeholder="Ex: Description détaillée..." className="placeholder:text-gray-400 placeholder:opacity-100"',
  'placeholder="Amount"': 'placeholder="Ex: 25000" className="placeholder:text-gray-400 placeholder:opacity-100"',
};

// Patterns pour identifier les inputs sans placeholders appropriés
const inputPatterns = [
  /<Input\s+[^>]*id="name"[^>]*>/g,
  /<Input\s+[^>]*id="email"[^>]*>/g,
  /<Input\s+[^>]*id="password"[^>]*>/g,
  /<Input\s+[^>]*id="phone"[^>]*>/g,
  /<Input\s+[^>]*id="address"[^>]*>/g,
  /<Input\s+[^>]*type="date"[^>]*>/g,
  /<Input\s+[^>]*type="number"[^>]*>/g,
];

function findFormFiles() {
  const patterns = [
    'components/**/*form*.tsx',
    'components/**/*Form*.tsx',
    'app/**/*form*.tsx',
    'app/**/*Form*.tsx',
  ];
  
  let files = [];
  patterns.forEach(pattern => {
    files = files.concat(glob.sync(pattern));
  });
  
  return [...new Set(files)]; // Remove duplicates
}

function improveFile(filePath) {
  console.log(`📝 Amélioration de: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Appliquer les mappings de placeholders
  Object.entries(placeholderMappings).forEach(([oldPattern, newPattern]) => {
    if (content.includes(oldPattern)) {
      content = content.replace(new RegExp(oldPattern, 'g'), newPattern);
      modified = true;
      console.log(`  ✅ Remplacé: ${oldPattern}`);
    }
  });
  
  // Ajouter des classes CSS aux inputs existants qui n'en ont pas
  const inputRegex = /<Input\s+([^>]*?)>/g;
  content = content.replace(inputRegex, (match, attributes) => {
    if (!attributes.includes('className=') && !attributes.includes('class=')) {
      modified = true;
      return `<Input ${attributes} className="placeholder:text-gray-400 placeholder:opacity-100">`;
    }
    return match;
  });
  
  // Ajouter des classes CSS aux textarea existants
  const textareaRegex = /<Textarea\s+([^>]*?)>/g;
  content = content.replace(textareaRegex, (match, attributes) => {
    if (!attributes.includes('className=') && !attributes.includes('class=')) {
      modified = true;
      return `<Textarea ${attributes} className="placeholder:text-gray-400 placeholder:opacity-100">`;
    }
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  💾 Fichier sauvegardé`);
    return true;
  } else {
    console.log(`  ⏭️  Aucun changement nécessaire`);
    return false;
  }
}

function main() {
  console.log('🚀 Amélioration des placeholders dans toute l\'application...\n');
  
  const formFiles = findFormFiles();
  console.log(`📁 Trouvé ${formFiles.length} fichiers de formulaires:\n`);
  
  let modifiedCount = 0;
  
  formFiles.forEach(file => {
    if (improveFile(file)) {
      modifiedCount++;
    }
    console.log(''); // Ligne vide pour la lisibilité
  });
  
  console.log(`\n✨ Terminé! ${modifiedCount} fichiers modifiés sur ${formFiles.length} fichiers analysés.`);
  console.log('\n📋 Résumé des améliorations:');
  console.log('  • Placeholders plus clairs et descriptifs');
  console.log('  • Couleur des placeholders améliorée (gray-400)');
  console.log('  • Opacité forcée à 100% pour une meilleure visibilité');
  console.log('  • Placeholders standardisés pour les champs de date');
  console.log('\n🔄 N\'oubliez pas de rafraîchir votre navigateur pour voir les changements!');
}

if (require.main === module) {
  main();
}

module.exports = { improveFile, findFormFiles };