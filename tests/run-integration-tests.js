#!/usr/bin/env node
// =====================================================
// SCRIPT D'EXÉCUTION DES TESTS D'INTÉGRATION
// =====================================================
// Script pour lancer et gérer les tests d'intégration
// =====================================================

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
  // Répertoires
  testDir: join(__dirname, 'integration'),
  resultsDir: join(__dirname, 'results'),
  reportsDir: join(__dirname, 'reports'),
  
  // Commandes
  commands: {
    install: 'npm install @playwright/test @supabase/supabase-js dotenv chalk ora',
    playwright: 'npx playwright install',
    test: 'npx playwright test',
    report: 'npx playwright show-report'
  },
  
  // Options par défaut
  defaultOptions: {
    headed: false,
    workers: 1,
    retries: 1,
    timeout: 30000,
    reporter: 'html'
  }
};

// =====================================================
// UTILITAIRES
// =====================================================

class TestRunner {
  constructor() {
    this.spinner = null;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
  }

  // Afficher le logo et les informations
  showHeader() {
    console.log(chalk.blue.bold('\n🧪 TESTS D\'INTÉGRATION - LOFT ALGERIE\n'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.cyan('Système de réservation client'));
    console.log(chalk.gray('Tests end-to-end et API'));
    console.log(chalk.gray('═'.repeat(50) + '\n'));
  }

  // Vérifier les prérequis
  async checkPrerequisites() {
    this.spinner = ora('Vérification des prérequis...').start();

    try {
      // Vérifier Node.js
      const nodeVersion = process.version;
      if (parseInt(nodeVersion.slice(1)) < 16) {
        throw new Error(`Node.js 16+ requis (version actuelle: ${nodeVersion})`);
      }

      // Vérifier les variables d'environnement
      const requiredEnvVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
      }

      // Créer les répertoires nécessaires
      [CONFIG.resultsDir, CONFIG.reportsDir].forEach(dir => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      });

      this.spinner.succeed('Prérequis vérifiés');
    } catch (error) {
      this.spinner.fail(`Erreur prérequis: ${error.message}`);
      process.exit(1);
    }
  }

  // Installer les dépendances
  async installDependencies() {
    this.spinner = ora('Installation des dépendances...').start();

    try {
      await this.runCommand(CONFIG.commands.install);
      await this.runCommand(CONFIG.commands.playwright);
      this.spinner.succeed('Dépendances installées');
    } catch (error) {
      this.spinner.fail(`Erreur installation: ${error.message}`);
      process.exit(1);
    }
  }

  // Vérifier la connectivité
  async checkConnectivity() {
    this.spinner = ora('Vérification de la connectivité...').start();

    try {
      // Vérifier Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { error } = await supabase.from('lofts').select('count').limit(1);
      if (error) throw new Error(`Supabase: ${error.message}`);

      // Vérifier l'application (si elle tourne)
      const appUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
      try {
        const response = await fetch(`${appUrl}/api/health`);
        if (response.ok) {
          this.spinner.succeed(`Connectivité OK (App: ${appUrl})`);
        } else {
          this.spinner.warn(`App non accessible sur ${appUrl} (tests API uniquement)`);
        }
      } catch {
        this.spinner.warn(`App non accessible sur ${appUrl} (tests API uniquement)`);
      }
    } catch (error) {
      this.spinner.fail(`Erreur connectivité: ${error.message}`);
      process.exit(1);
    }
  }

  // Exécuter une commande
  runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: true,
        ...options
      });

      let output = '';
      if (options.silent) {
        child.stdout?.on('data', (data) => {
          output += data.toString();
        });
        child.stderr?.on('data', (data) => {
          output += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${output}`));
        }
      });

      child.on('error', reject);
    });
  }

  // Construire la commande de test
  buildTestCommand(options) {
    let command = CONFIG.commands.test;

    // Ajouter les options
    if (options.headed) command += ' --headed';
    if (options.debug) command += ' --debug';
    if (options.workers) command += ` --workers=${options.workers}`;
    if (options.retries) command += ` --retries=${options.retries}`;
    if (options.timeout) command += ` --timeout=${options.timeout}`;
    if (options.reporter) command += ` --reporter=${options.reporter}`;
    if (options.project) command += ` --project=${options.project}`;
    if (options.grep) command += ` --grep="${options.grep}"`;
    if (options.config) command += ` --config=${options.config}`;

    // Ajouter les fichiers de test spécifiques
    if (options.files && options.files.length > 0) {
      command += ` ${options.files.join(' ')}`;
    }

    return command;
  }

  // Exécuter les tests
  async runTests(options = {}) {
    const testOptions = { ...CONFIG.defaultOptions, ...options };
    const command = this.buildTestCommand(testOptions);

    console.log(chalk.blue('\n📋 Configuration des tests:'));
    console.log(chalk.gray(`Commande: ${command}`));
    console.log(chalk.gray(`Workers: ${testOptions.workers}`));
    console.log(chalk.gray(`Timeout: ${testOptions.timeout}ms`));
    console.log(chalk.gray(`Reporter: ${testOptions.reporter}\n`));

    this.spinner = ora('Exécution des tests...').start();
    const startTime = Date.now();

    try {
      const output = await this.runCommand(command, { silent: true });
      const duration = Date.now() - startTime;

      // Parser les résultats
      this.parseResults(output, duration);
      this.showResults();

      if (this.results.failed > 0) {
        this.spinner.fail(`Tests terminés avec ${this.results.failed} échec(s)`);
        return false;
      } else {
        this.spinner.succeed('Tous les tests ont réussi');
        return true;
      }
    } catch (error) {
      this.spinner.fail('Erreur lors de l\'exécution des tests');
      console.error(chalk.red(error.message));
      return false;
    }
  }

  // Parser les résultats des tests
  parseResults(output, duration) {
    this.results.duration = duration;

    // Parser la sortie Playwright (format basique)
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('passed')) {
        const match = line.match(/(\d+) passed/);
        if (match) this.results.passed = parseInt(match[1]);
      }
      if (line.includes('failed')) {
        const match = line.match(/(\d+) failed/);
        if (match) this.results.failed = parseInt(match[1]);
      }
      if (line.includes('skipped')) {
        const match = line.match(/(\d+) skipped/);
        if (match) this.results.skipped = parseInt(match[1]);
      }
    }

    this.results.total = this.results.passed + this.results.failed + this.results.skipped;
  }

  // Afficher les résultats
  showResults() {
    console.log(chalk.blue('\n📊 RÉSULTATS DES TESTS\n'));
    console.log(chalk.gray('═'.repeat(30)));
    
    console.log(chalk.white(`Total: ${this.results.total}`));
    console.log(chalk.green(`✅ Réussis: ${this.results.passed}`));
    
    if (this.results.failed > 0) {
      console.log(chalk.red(`❌ Échoués: ${this.results.failed}`));
    }
    
    if (this.results.skipped > 0) {
      console.log(chalk.yellow(`⏭️  Ignorés: ${this.results.skipped}`));
    }
    
    console.log(chalk.gray(`⏱️  Durée: ${(this.results.duration / 1000).toFixed(2)}s`));
    console.log(chalk.gray('═'.repeat(30)));

    // Calculer le taux de réussite
    if (this.results.total > 0) {
      const successRate = (this.results.passed / this.results.total * 100).toFixed(1);
      console.log(chalk.cyan(`📈 Taux de réussite: ${successRate}%`));
    }
  }

  // Générer un rapport détaillé
  async generateReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        supabaseUrl: process.env.SUPABASE_URL,
        testBaseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
      }
    };

    const reportPath = join(CONFIG.reportsDir, `test-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log(chalk.blue(`\n📄 Rapport généré: ${reportPath}`));
  }

  // Ouvrir le rapport HTML
  async openReport() {
    try {
      await this.runCommand(CONFIG.commands.report);
    } catch (error) {
      console.log(chalk.yellow('Impossible d\'ouvrir le rapport automatiquement'));
    }
  }
}

// =====================================================
// INTERFACE EN LIGNE DE COMMANDE
// =====================================================

class CLI {
  constructor() {
    this.runner = new TestRunner();
  }

  // Afficher l'aide
  showHelp() {
    console.log(chalk.blue.bold('\n🧪 TESTS D\'INTÉGRATION - AIDE\n'));
    console.log('Usage: node run-integration-tests.js [options]\n');
    
    console.log(chalk.yellow('Options:'));
    console.log('  --help, -h          Afficher cette aide');
    console.log('  --headed            Exécuter avec interface graphique');
    console.log('  --debug             Mode debug');
    console.log('  --workers <n>       Nombre de workers parallèles');
    console.log('  --retries <n>       Nombre de tentatives en cas d\'échec');
    console.log('  --timeout <ms>      Timeout par test');
    console.log('  --reporter <type>   Type de reporter (html, json, junit)');
    console.log('  --project <name>    Projet spécifique (chromium, firefox, webkit)');
    console.log('  --grep <pattern>    Filtrer les tests par nom');
    console.log('  --api-only          Tests API uniquement');
    console.log('  --e2e-only          Tests E2E uniquement');
    console.log('  --db-only           Tests base de données uniquement');
    console.log('  --quick             Tests rapides uniquement');
    console.log('  --install           Installer les dépendances');
    console.log('  --report            Ouvrir le rapport HTML');
    
    console.log(chalk.yellow('\nExemples:'));
    console.log('  node run-integration-tests.js --headed --debug');
    console.log('  node run-integration-tests.js --api-only --workers=1');
    console.log('  node run-integration-tests.js --grep="réservation"');
    console.log('  node run-integration-tests.js --project=chromium --quick\n');
  }

  // Parser les arguments
  parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    const flags = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        
        if (['help', 'h'].includes(key)) {
          this.showHelp();
          process.exit(0);
        }
        
        if (['headed', 'debug', 'install', 'report', 'api-only', 'e2e-only', 'db-only', 'quick'].includes(key)) {
          flags.push(key);
        } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          options[key] = args[i + 1];
          i++; // Skip next arg
        } else {
          options[key] = true;
        }
      }
    }

    return { options, flags };
  }

  // Exécuter selon les arguments
  async run() {
    const { options, flags } = this.parseArgs();

    this.runner.showHeader();

    // Installation des dépendances
    if (flags.includes('install')) {
      await this.runner.installDependencies();
      return;
    }

    // Ouvrir le rapport
    if (flags.includes('report')) {
      await this.runner.openReport();
      return;
    }

    // Vérifications préliminaires
    await this.runner.checkPrerequisites();
    await this.runner.checkConnectivity();

    // Configuration des tests selon les flags
    const testOptions = { ...options };

    if (flags.includes('headed')) testOptions.headed = true;
    if (flags.includes('debug')) testOptions.debug = true;
    if (flags.includes('quick')) testOptions.timeout = 10000;

    // Sélection des fichiers de test
    const testFiles = [];
    if (flags.includes('api-only')) {
      testFiles.push('api-endpoints.test.js');
    } else if (flags.includes('e2e-only')) {
      testFiles.push('reservation-flow.test.js');
    } else if (flags.includes('db-only')) {
      testFiles.push('database-integration.test.js');
    }

    if (testFiles.length > 0) {
      testOptions.files = testFiles;
    }

    // Exécution des tests
    const success = await this.runner.runTests(testOptions);
    
    // Génération du rapport
    await this.runner.generateReport();

    // Code de sortie
    process.exit(success ? 0 : 1);
  }
}

// =====================================================
// POINT D'ENTRÉE
// =====================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new CLI();
  cli.run().catch(error => {
    console.error(chalk.red('Erreur fatale:'), error);
    process.exit(1);
  });
}

export { TestRunner, CLI };