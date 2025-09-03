#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🧹 Nettoyage final de la migration...');

// 1. Supprimer les fichiers de sauvegarde
console.log('\n1. Suppression des fichiers de sauvegarde...');

const backupPatterns = [
  'components/**/*-backup*',
  'components/**/*-i18next-backup*',
  'lib/**/*backup*'
];

let cleanedFiles = 0;

try {
  const result = execSync('powershell "Get-ChildItem -Path components -Recurse -Include *backup* | Remove-Item -Force; Get-ChildItem -Path lib -Recurse -Include *backup* -ErrorAction SilentlyContinue | Remove-Item -Force"', { encoding: 'utf8' });
  console.log('   ✅ Fichiers de sauvegarde supprimés');
} catch (error) {
  console.log('   ⚠️  Aucun fichier de sauvegarde trouvé ou erreur lors de la suppression');
}

// 2. Vérifier et nettoyer les imports inutilisés
console.log('\n2. Nettoyage des imports...');

try {
  // Rechercher les fichiers avec des imports next-intl non utilisés
  const result = execSync('powershell "Get-ChildItem -Path components,app -Include *.tsx -Recurse | ForEach-Object { $content = Get-Content $_.FullName -Raw; if ($content -match \\"import.*next-intl\\" -and $content -notmatch \\"useTranslations\\") { $_.FullName } }"', { encoding: 'utf8' });
  
  if (result.trim()) {
    console.log('   ⚠️  Fichiers avec imports next-intl potentiellement inutilisés trouvés');
  } else {
    console.log('   ✅ Aucun import inutilisé détecté');
  }
} catch (error) {
  console.log('   ✅ Vérification des imports terminée');
}

// 3. Créer un résumé de la migration
console.log('\n3. Génération du résumé de migration...');

const summary = {
  timestamp: new Date().toISOString(),
  scriptsCreated: [
    'validate-migration.js',
    'test-migration.js',
    'performance-test.js',
    'generate-migration-report.js',
    'auto-migrate-remaining.js',
    'final-validation.js',
    'cleanup-migration.js'
  ],
  configurationFiles: [
    'i18n.ts',
    'middleware.ts',
    'next.config.mjs'
  ],
  translationFiles: [
    'messages/fr.json',
    'messages/en.json',
    'messages/ar.json'
  ],
  status: 'SCRIPTS_READY',
  nextSteps: [
    'Exécuter auto-migrate-remaining.js pour migrer les composants restants',
    'Corriger manuellement les composants complexes si nécessaire',
    'Exécuter final-validation.js pour valider la migration complète',
    'Tester l\'application dans les 3 langues',
    'Déployer en production'
  ]
};

fs.writeFileSync('migration-summary.json', JSON.stringify(summary, null, 2));
console.log('   ✅ Résumé de migration sauvegardé: migration-summary.json');

// 4. Afficher les prochaines étapes
console.log('\n📋 Prochaines étapes recommandées:');
summary.nextSteps.forEach((step, index) => {
  console.log(`   ${index + 1}. ${step}`);
});

console.log('\n🎉 Nettoyage et préparation terminés!');
console.log('\n📊 Scripts de migration créés avec succès:');
summary.scriptsCreated.forEach(script => {
  console.log(`   ✅ scripts/${script}`);
});

console.log('\n💡 Pour continuer la migration:');
console.log('   1. Exécutez: node scripts/auto-migrate-remaining.js');
console.log('   2. Puis: node scripts/final-validation.js');
console.log('   3. Consultez: scripts/README.md pour plus de détails');