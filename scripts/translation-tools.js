#!/usr/bin/env node

import TranslationAnalyzer from './translation-analyzer.js';
import TranslationMonitor from './translation-monitor.js';

/**
 * Outil en ligne de commande pour la gestion des traductions
 */
class TranslationTools {
  constructor() {
    this.commands = {
      'analyze': 'Analyser et corriger les traductions manquantes',
      'monitor': 'Surveiller les traductions en temps réel',
      'fix': 'Corriger automatiquement les traductions courantes',
      'report': 'Générer un rapport détaillé',
      'help': 'Afficher cette aide'
    };
  }

  /**
   * Affiche l'aide
   */
  showHelp() {
    console.log('🔧 Outils de gestion des traductions\n');
    console.log('Usage: node scripts/translation-tools.js <commande>\n');
    console.log('Commandes disponibles:');
    
    Object.entries(this.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(10)} - ${desc}`);
    });
    
    console.log('\nExemples:');
    console.log('  node scripts/translation-tools.js analyze');
    console.log('  node scripts/translation-tools.js monitor');
    console.log('  node scripts/translation-tools.js fix');
  }

  /**
   * Exécute l'analyse complète
   */
  async runAnalyze() {
    console.log('🔍 Lancement de l\'analyse complète...\n');
    const analyzer = new TranslationAnalyzer();
    await analyzer.run();
  }

  /**
   * Démarre le moniteur
   */
  async runMonitor() {
    console.log('👀 Démarrage du moniteur en temps réel...\n');
    const monitor = new TranslationMonitor();
    await monitor.init();
    
    console.log('\n✨ Moniteur actif. Appuyez sur Ctrl+C pour arrêter.\n');
    
    // Garder le processus actif
    process.stdin.resume();
  }

  /**
   * Correction rapide des traductions courantes
   */
  async runFix() {
    console.log('🔧 Correction automatique des traductions courantes...\n');
    
    const analyzer = new TranslationAnalyzer();
    analyzer.loadTranslationFiles();
    analyzer.analyzeMissingTranslations();
    analyzer.generateAutoTranslations();
    analyzer.saveTranslationFiles();
    
    console.log('✅ Corrections appliquées !');
  }

  /**
   * Génère un rapport uniquement
   */
  async runReport() {
    console.log('📊 Génération du rapport...\n');
    
    const analyzer = new TranslationAnalyzer();
    analyzer.loadTranslationFiles();
    analyzer.analyzeMissingTranslations();
    const report = analyzer.generateReport();
    
    console.log('\n📈 Résumé du rapport:');
    analyzer.languages.forEach(lang => {
      const summary = report.summary[lang];
      console.log(`${lang.toUpperCase()}: ${summary.completeness}% complet (${summary.totalKeys - summary.missingKeys}/${summary.totalKeys} clés)`);
    });
  }

  /**
   * Point d'entrée principal
   */
  async run() {
    const command = process.argv[2];
    
    if (!command || command === 'help') {
      this.showHelp();
      return;
    }
    
    if (!this.commands[command]) {
      console.error(`❌ Commande inconnue: ${command}`);
      console.log('Utilisez "help" pour voir les commandes disponibles.');
      return;
    }
    
    try {
      switch (command) {
        case 'analyze':
          await this.runAnalyze();
          break;
        case 'monitor':
          await this.runMonitor();
          break;
        case 'fix':
          await this.runFix();
          break;
        case 'report':
          await this.runReport();
          break;
      }
    } catch (error) {
      console.error('❌ Erreur:', error.message);
      process.exit(1);
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url.endsWith(process.argv[1])) {
  const tools = new TranslationTools();
  tools.run();
}

export default TranslationTools;