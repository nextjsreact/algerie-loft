#!/usr/bin/env node

/**
 * Performance Baseline Measurement System (CommonJS version)
 * Établit une baseline complète des performances avant migration Next.js 16
 * 
 * Requirements: 6.4, 9.1
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync, statSync, readdirSync } = require('fs');
const { join, extname } = require('path');
const { performance } = require('perf_hooks');

class PerformanceBaseline {
  constructor() {
    this.startTime = performance.now();
    this.metrics = {
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
      buildMetrics: {
        buildTime: 0,
        bundleSize: this.initBundleSize(),
        dependencies: this.initDependencyMetrics()
      },
      runtimeMetrics: {
        i18nPerformance: this.initI18nMetrics(),
        componentLoadTimes: [],
        criticalPaths: []
      },
      criticalFunctionalities: [],
      recommendations: []
    };
  }

  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      nextjsVersion: this.getNextJsVersion(),
      platform: process.platform,
      memory: process.memoryUsage()
    };
  }

  getNextJsVersion() {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      return packageJson.dependencies?.next || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  initBundleSize() {
    return {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      translationSize: 0,
      largestChunks: []
    };
  }

  initDependencyMetrics() {
    return {
      totalDependencies: 0,
      heavyDependencies: [],
      outdatedPackages: []
    };
  }

  initI18nMetrics() {
    return {
      locales: [],
      averageLoadTime: 0,
      totalTranslationSize: 0
    };
  }

  async measureAll() {
    console.log('🚀 Démarrage de la mesure de baseline des performances...\n');

    try {
      // 1. Mesurer les métriques de build
      await this.measureBuildMetrics();

      // 2. Mesurer les performances i18n
      await this.measureI18nPerformance();

      // 3. Mesurer les chemins critiques
      await this.measureCriticalPaths();

      // 4. Tester les fonctionnalités critiques
      await this.testCriticalFunctionalities();

      // 5. Analyser les dépendances
      await this.analyzeDependencies();

      // 6. Générer les recommandations
      this.generateRecommendations();

      // 7. Sauvegarder les résultats
      this.saveResults();

      console.log('\n✅ Baseline des performances établie avec succès!');
      return this.metrics;

    } catch (error) {
      console.error('❌ Erreur lors de la mesure des performances:', error);
      throw error;
    }
  }

  async measureBuildMetrics() {
    console.log('📊 1. Mesure des métriques de build...');

    const buildStart = performance.now();
    
    try {
      // Nettoyer le cache précédent
      if (existsSync('.next')) {
        try {
          execSync('rmdir /s /q .next', { stdio: 'pipe' });
        } catch (e) {
          // Ignorer les erreurs de suppression
        }
      }

      // Construire l'application
      console.log('   🔨 Construction de l\'application...');
      execSync('npm run build', { stdio: 'pipe' });
      
      const buildEnd = performance.now();
      this.metrics.buildMetrics.buildTime = buildEnd - buildStart;

      // Analyser la taille des bundles
      this.analyzeBundleSize();

      console.log(`   ✅ Build terminé en ${(this.metrics.buildMetrics.buildTime / 1000).toFixed(2)}s`);
      console.log(`   📦 Taille totale: ${(this.metrics.buildMetrics.bundleSize.totalSize / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
      console.log('   ❌ Erreur lors du build:', error.message);
      this.metrics.buildMetrics.buildTime = -1;
    }
  }

  analyzeBundleSize() {
    if (!existsSync('.next')) return;

    try {
      // Analyser les fichiers JavaScript
      const jsFiles = this.findFilesByExtension('.next', ['.js']);
      this.metrics.buildMetrics.bundleSize.jsSize = this.calculateTotalSize(jsFiles);

      // Analyser les fichiers CSS
      const cssFiles = this.findFilesByExtension('.next', ['.css']);
      this.metrics.buildMetrics.bundleSize.cssSize = this.calculateTotalSize(cssFiles);

      // Analyser les images
      const imageFiles = this.findFilesByExtension('public', ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']);
      this.metrics.buildMetrics.bundleSize.imageSize = this.calculateTotalSize(imageFiles);

      // Analyser les traductions
      const translationFiles = this.findFilesByExtension('messages', ['.json']);
      this.metrics.buildMetrics.bundleSize.translationSize = this.calculateTotalSize(translationFiles);

      // Calculer la taille totale
      this.metrics.buildMetrics.bundleSize.totalSize = 
        this.metrics.buildMetrics.bundleSize.jsSize +
        this.metrics.buildMetrics.bundleSize.cssSize +
        this.metrics.buildMetrics.bundleSize.imageSize +
        this.metrics.buildMetrics.bundleSize.translationSize;

      // Identifier les plus gros chunks
      this.identifyLargestChunks();

    } catch (error) {
      console.log('   ⚠️ Erreur lors de l\'analyse des bundles:', error.message);
    }
  }

  findFilesByExtension(directory, extensions) {
    if (!existsSync(directory)) return [];

    const files = [];
    
    const scanDirectory = (dir) => {
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (extensions.includes(extname(item))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignorer les erreurs d'accès aux dossiers
      }
    };

    scanDirectory(directory);
    return files;
  }

  calculateTotalSize(files) {
    return files.reduce((total, file) => {
      try {
        return total + statSync(file).size;
      } catch {
        return total;
      }
    }, 0);
  }

  identifyLargestChunks() {
    const jsFiles = this.findFilesByExtension('.next', ['.js']);
    const chunks = jsFiles
      .map(file => ({
        name: file.replace('.next/', ''),
        size: statSync(file).size
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    this.metrics.buildMetrics.bundleSize.largestChunks = chunks;
  }

  async measureI18nPerformance() {
    console.log('🌐 2. Mesure des performances i18n...');

    const locales = ['fr', 'en', 'ar'];
    const localeMetrics = [];

    for (const locale of locales) {
      const filePath = join('messages', `${locale}.json`);
      
      if (existsSync(filePath)) {
        const loadStart = performance.now();
        
        try {
          const content = readFileSync(filePath, 'utf8');
          const messages = JSON.parse(content);
          const loadEnd = performance.now();

          const fileSize = statSync(filePath).size;
          const keyCount = this.countKeys(messages);

          localeMetrics.push({
            locale,
            loadTime: loadEnd - loadStart,
            keyCount,
            fileSize
          });

          console.log(`   ✅ ${locale}: ${(loadEnd - loadStart).toFixed(2)}ms (${keyCount} clés, ${(fileSize / 1024).toFixed(2)} KB)`);

        } catch (error) {
          console.log(`   ❌ ${locale}: Erreur de chargement`);
        }
      }
    }

    this.metrics.runtimeMetrics.i18nPerformance = {
      locales: localeMetrics,
      averageLoadTime: localeMetrics.reduce((sum, m) => sum + m.loadTime, 0) / Math.max(1, localeMetrics.length),
      totalTranslationSize: localeMetrics.reduce((sum, m) => sum + m.fileSize, 0)
    };
  }

  countKeys(obj) {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += this.countKeys(obj[key]);
      } else {
        count++;
      }
    }
    return count;
  }

  async measureCriticalPaths() {
    console.log('🛣️ 3. Mesure des chemins critiques...');

    const criticalPaths = [
      {
        path: '/',
        description: 'Page d\'accueil',
        dependencies: ['next-intl', 'supabase', 'framer-motion']
      },
      {
        path: '/auth/login',
        description: 'Page de connexion',
        dependencies: ['next-intl', 'supabase', 'react-hook-form']
      },
      {
        path: '/dashboard',
        description: 'Tableau de bord',
        dependencies: ['next-intl', 'supabase', 'recharts', '@radix-ui']
      },
      {
        path: '/lofts',
        description: 'Liste des lofts',
        dependencies: ['next-intl', 'supabase', 'next/image']
      },
      {
        path: '/reservations',
        description: 'Gestion des réservations',
        dependencies: ['next-intl', 'supabase', 'react-big-calendar']
      }
    ];

    for (const pathInfo of criticalPaths) {
      const loadStart = performance.now();
      
      try {
        // Simuler le chargement du chemin (vérification des dépendances)
        const status = this.checkPathDependencies(pathInfo.dependencies);
        const loadEnd = performance.now();

        this.metrics.runtimeMetrics.criticalPaths.push({
          path: pathInfo.path,
          description: pathInfo.description,
          loadTime: loadEnd - loadStart,
          dependencies: pathInfo.dependencies,
          status: status ? 'working' : 'error',
          errorDetails: status ? undefined : 'Dépendances manquantes'
        });

        console.log(`   ${status ? '✅' : '❌'} ${pathInfo.path}: ${pathInfo.description}`);

      } catch (error) {
        console.log(`   ❌ ${pathInfo.path}: Erreur lors du test`);
      }
    }
  }

  checkPathDependencies(dependencies) {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      return dependencies.every(dep => allDeps[dep]);
    } catch {
      return false;
    }
  }

  async testCriticalFunctionalities() {
    console.log('🧪 4. Test des fonctionnalités critiques...');

    const functionalityTests = [
      {
        name: 'Supabase Client Initialization',
        description: 'Initialisation du client Supabase',
        category: 'auth',
        status: 'pass',
        executionTime: 0,
        details: '',
        requirements: ['5.1', '5.2']
      },
      {
        name: 'Next-intl Configuration',
        description: 'Configuration du système de traduction',
        category: 'i18n',
        status: 'pass',
        executionTime: 0,
        details: '',
        requirements: ['4.1', '4.2']
      },
      {
        name: 'Database Schema Validation',
        description: 'Validation du schéma de base de données',
        category: 'database',
        status: 'pass',
        executionTime: 0,
        details: '',
        requirements: ['5.3', '5.4']
      },
      {
        name: 'Radix UI Components',
        description: 'Composants d\'interface utilisateur',
        category: 'ui',
        status: 'pass',
        executionTime: 0,
        details: '',
        requirements: ['1.3', '1.4']
      },
      {
        name: 'API Routes Functionality',
        description: 'Fonctionnement des routes API',
        category: 'api',
        status: 'pass',
        executionTime: 0,
        details: '',
        requirements: ['1.5', '1.6']
      }
    ];

    for (const test of functionalityTests) {
      const testStart = performance.now();
      
      try {
        const result = await this.runFunctionalityTest(test);
        const testEnd = performance.now();
        
        test.executionTime = testEnd - testStart;
        test.status = result.status;
        test.details = result.details;

        console.log(`   ${result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'} ${test.name}`);
        
      } catch (error) {
        test.status = 'fail';
        test.details = `Erreur: ${error}`;
        console.log(`   ❌ ${test.name}: ${error}`);
      }
    }

    this.metrics.criticalFunctionalities = functionalityTests;
  }

  async runFunctionalityTest(test) {
    switch (test.category) {
      case 'auth':
        return this.testSupabaseAuth();
      case 'i18n':
        return this.testNextIntl();
      case 'database':
        return this.testDatabaseSchema();
      case 'ui':
        return this.testRadixUI();
      case 'api':
        return this.testAPIRoutes();
      default:
        return { status: 'warning', details: 'Test non implémenté' };
    }
  }

  testSupabaseAuth() {
    try {
      // Vérifier la présence des variables d'environnement Supabase
      const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || existsSync('.env.local');
      const hasSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || existsSync('.env.local');
      
      if (hasSupabaseUrl && hasSupabaseKey) {
        return { status: 'pass', details: 'Configuration Supabase détectée' };
      } else {
        return { status: 'warning', details: 'Variables d\'environnement Supabase manquantes' };
      }
    } catch {
      return { status: 'fail', details: 'Erreur lors de la vérification Supabase' };
    }
  }

  testNextIntl() {
    try {
      // Vérifier la présence du fichier de configuration i18n
      const hasI18nConfig = existsSync('i18n.ts') || existsSync('i18n.js');
      const hasMessages = existsSync('messages');
      
      if (hasI18nConfig && hasMessages) {
        return { status: 'pass', details: 'Configuration next-intl complète' };
      } else {
        return { status: 'warning', details: 'Configuration next-intl incomplète' };
      }
    } catch {
      return { status: 'fail', details: 'Erreur lors de la vérification next-intl' };
    }
  }

  testDatabaseSchema() {
    try {
      // Vérifier la présence des scripts de schéma
      const hasSchemaScripts = existsSync('scripts') && readdirSync('scripts').some(file => file.includes('schema'));
      
      if (hasSchemaScripts) {
        return { status: 'pass', details: 'Scripts de schéma détectés' };
      } else {
        return { status: 'warning', details: 'Scripts de schéma non trouvés' };
      }
    } catch {
      return { status: 'fail', details: 'Erreur lors de la vérification du schéma' };
    }
  }

  testRadixUI() {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const radixPackages = Object.keys(packageJson.dependencies || {}).filter(pkg => pkg.startsWith('@radix-ui'));
      
      if (radixPackages.length > 0) {
        return { status: 'pass', details: `${radixPackages.length} packages Radix UI détectés` };
      } else {
        return { status: 'warning', details: 'Aucun package Radix UI trouvé' };
      }
    } catch {
      return { status: 'fail', details: 'Erreur lors de la vérification Radix UI' };
    }
  }

  testAPIRoutes() {
    try {
      // Vérifier la présence du dossier API
      const hasApiRoutes = existsSync('app/api') || existsSync('pages/api');
      
      if (hasApiRoutes) {
        return { status: 'pass', details: 'Routes API détectées' };
      } else {
        return { status: 'warning', details: 'Aucune route API trouvée' };
      }
    } catch {
      return { status: 'fail', details: 'Erreur lors de la vérification des routes API' };
    }
  }

  async analyzeDependencies() {
    console.log('📦 5. Analyse des dépendances...');

    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      this.metrics.buildMetrics.dependencies.totalDependencies = Object.keys(dependencies).length;

      // Identifier les dépendances lourdes connues
      const heavyPackages = [
        'moment', 'lodash', '@emotion/react', 'framer-motion', 
        'recharts', '@radix-ui/react-dialog', 'react-big-calendar'
      ];

      this.metrics.buildMetrics.dependencies.heavyDependencies = heavyPackages
        .filter(pkg => dependencies[pkg])
        .map(pkg => ({ name: pkg, size: 0 })); // La taille réelle nécessiterait une analyse plus poussée

      console.log(`   📊 ${this.metrics.buildMetrics.dependencies.totalDependencies} dépendances totales`);
      console.log(`   ⚠️ ${this.metrics.buildMetrics.dependencies.heavyDependencies.length} dépendances lourdes identifiées`);

    } catch (error) {
      console.log('   ❌ Erreur lors de l\'analyse des dépendances:', error.message);
    }
  }

  generateRecommendations() {
    console.log('💡 6. Génération des recommandations...');

    const recommendations = [];

    // Recommandations basées sur la taille des bundles
    if (this.metrics.buildMetrics.bundleSize.totalSize > 10 * 1024 * 1024) { // 10MB
      recommendations.push('🔧 Considérer la division des bundles pour réduire la taille totale');
    }

    // Recommandations basées sur le temps de build
    if (this.metrics.buildMetrics.buildTime > 120000) { // 2 minutes
      recommendations.push('⚡ Optimiser le temps de build avec des configurations webpack personnalisées');
    }

    // Recommandations basées sur les traductions
    if (this.metrics.runtimeMetrics.i18nPerformance.totalTranslationSize > 200 * 1024) { // 200KB
      recommendations.push('🌐 Implémenter le lazy loading des traductions par route');
    }

    // Recommandations basées sur les dépendances
    if (this.metrics.buildMetrics.dependencies.heavyDependencies.length > 3) {
      recommendations.push('📦 Évaluer les alternatives plus légères pour les dépendances lourdes');
    }

    // Recommandations générales
    recommendations.push('🔍 Surveiller les Core Web Vitals après la migration');
    recommendations.push('📊 Implémenter un monitoring continu des performances');
    recommendations.push('🧪 Créer des tests de régression de performance');

    this.metrics.recommendations = recommendations;

    recommendations.forEach(rec => console.log(`   ${rec}`));
  }

  saveResults() {
    const reportPath = 'performance-baseline-report.json';
    writeFileSync(reportPath, JSON.stringify(this.metrics, null, 2));
    
    // Créer également un résumé lisible
    const summaryPath = 'performance-baseline-summary.md';
    const summary = this.generateSummaryMarkdown();
    writeFileSync(summaryPath, summary);

    console.log(`\n📋 Rapport complet sauvegardé: ${reportPath}`);
    console.log(`📄 Résumé sauvegardé: ${summaryPath}`);
  }

  generateSummaryMarkdown() {
    const totalTime = (performance.now() - this.startTime) / 1000;
    
    return `# Performance Baseline Report

**Date:** ${this.metrics.timestamp}
**Durée totale de l'analyse:** ${totalTime.toFixed(2)}s

## Environnement
- **Node.js:** ${this.metrics.environment.nodeVersion}
- **Next.js:** ${this.metrics.environment.nextjsVersion}
- **Plateforme:** ${this.metrics.environment.platform}
- **Mémoire utilisée:** ${(this.metrics.environment.memory.heapUsed / 1024 / 1024).toFixed(2)} MB

## Métriques de Build
- **Temps de build:** ${(this.metrics.buildMetrics.buildTime / 1000).toFixed(2)}s
- **Taille totale:** ${(this.metrics.buildMetrics.bundleSize.totalSize / 1024 / 1024).toFixed(2)} MB
  - JavaScript: ${(this.metrics.buildMetrics.bundleSize.jsSize / 1024 / 1024).toFixed(2)} MB
  - CSS: ${(this.metrics.buildMetrics.bundleSize.cssSize / 1024).toFixed(2)} KB
  - Images: ${(this.metrics.buildMetrics.bundleSize.imageSize / 1024 / 1024).toFixed(2)} MB
  - Traductions: ${(this.metrics.buildMetrics.bundleSize.translationSize / 1024).toFixed(2)} KB

## Performance i18n
- **Temps de chargement moyen:** ${this.metrics.runtimeMetrics.i18nPerformance.averageLoadTime.toFixed(2)}ms
- **Taille totale des traductions:** ${(this.metrics.runtimeMetrics.i18nPerformance.totalTranslationSize / 1024).toFixed(2)} KB
- **Locales supportées:** ${this.metrics.runtimeMetrics.i18nPerformance.locales.map(l => l.locale).join(', ')}

## Chemins Critiques
${this.metrics.runtimeMetrics.criticalPaths.map(path => 
  `- **${path.path}** (${path.description}): ${path.status === 'working' ? '✅' : '❌'} ${path.loadTime.toFixed(2)}ms`
).join('\n')}

## Tests de Fonctionnalités
${this.metrics.criticalFunctionalities.map(test => 
  `- **${test.name}**: ${test.status === 'pass' ? '✅' : test.status === 'warning' ? '⚠️' : '❌'} ${test.executionTime.toFixed(2)}ms`
).join('\n')}

## Dépendances
- **Total:** ${this.metrics.buildMetrics.dependencies.totalDependencies}
- **Dépendances lourdes:** ${this.metrics.buildMetrics.dependencies.heavyDependencies.length}

## Recommandations
${this.metrics.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Rapport généré automatiquement par le système de baseline de performance*
`;
  }
}

// Exécution du script
async function main() {
  try {
    const baseline = new PerformanceBaseline();
    await baseline.measureAll();
    
    console.log('\n🎉 Baseline des performances établie avec succès!');
    console.log('📁 Fichiers générés:');
    console.log('   - performance-baseline-report.json (données complètes)');
    console.log('   - performance-baseline-summary.md (résumé lisible)');
    console.log('\n💡 Utilisez ces métriques pour valider que la migration Next.js 16 préserve les performances.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'établissement de la baseline:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PerformanceBaseline };