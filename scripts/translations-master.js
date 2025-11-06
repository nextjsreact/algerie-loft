#!/usr/bin/env node

import { execSync } from 'child_process';

/**
 * Script maître pour orchestrer tous les outils de traduction
 */
console.log('🎯 Script maître de gestion des traductions\n');

const commands = {
  'full-check': 'Diagnostic complet et correction automatique',
  'watch': 'Surveillance en temps réel',
  'fix-interface': 'Correction des problèmes d\'interface',
  'detect-hardcoded': 'Détection des textes en dur',
  'validate': 'Validation finale',
  'help': 'Afficher cette aide'
};

const command = process.argv[2];

if (!command || command === 'help') {
  console.log('🛠️  Outils de traduction disponibles:\n');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(15)} - ${desc}`);
  });
  
  console.log('\n📋 Scripts npm disponibles:');
  console.log('  npm run translations:analyze   - Analyse avancée');
  console.log('  npm run translations:watch     - Surveillance temps réel');
  console.log('  npm run translations:fix       - Correction interface');
  console.log('  npm run translations:report    - Rapport simple');
  
  console.log('\n🎯 Exemples d\'utilisation:');
  console.log('  node scripts/translations-master.js full-check');
  console.log('  node scripts/translations-master.js watch');
  console.log('  npm run translations:analyze');
  
  process.exit(0);
}

function runCommand(cmd, description) {
  console.log(`🔄 ${description}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${description} terminé\n`);
  } catch (error) {
    console.error(`❌ Erreur lors de ${description}:`, error.message);
    process.exit(1);
  }
}

switch (command) {
  case 'full-check':
    console.log('🚀 Diagnostic complet et correction automatique\n');
    runCommand('npm run translations:analyze', 'Analyse avancée');
    runCommand('npm run translations:fix', 'Correction interface');
    runCommand('node scripts/detect-hardcoded-text.js', 'Détection textes en dur');
    runCommand('node scripts/final-validation.js', 'Validation finale');
    console.log('🎉 Diagnostic complet terminé !');
    console.log('💡 Consultez les rapports générés pour les corrections manuelles restantes');
    break;
    
  case 'watch':
    console.log('👀 Démarrage de la surveillance en temps réel...');
    runCommand('npm run translations:watch', 'Surveillance traductions');
    break;
    
  case 'fix-interface':
    console.log('🔧 Correction des problèmes d\'interface...');
    runCommand('npm run translations:fix', 'Correction interface');
    runCommand('node scripts/final-validation.js', 'Validation');
    break;
    
  case 'detect-hardcoded':
    console.log('🔍 Détection des textes en dur...');
    runCommand('node scripts/detect-hardcoded-text.js', 'Détection textes en dur');
    runCommand('node scripts/simple-report-usage.js', 'Analyse du rapport');
    break;
    
  case 'validate':
    console.log('✅ Validation finale...');
    runCommand('node scripts/final-validation.js', 'Validation finale');
    break;
    
  default:
    console.error(`❌ Commande inconnue: ${command}`);
    console.log('Utilisez "help" pour voir les commandes disponibles');
    process.exit(1);
}