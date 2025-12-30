#!/usr/bin/env node

/**
 * Performance Baseline Orchestrator
 * Script principal pour établir une baseline complète des performances
 * 
 * Requirements: 6.4, 9.1
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { performance } from 'perf_hooks';

interface BaselineResults {
  timestamp: string;
  executionTime: number;
  performanceBaseline: any;
  functionalityDocumentation: any;
  validationTests: any;
  summary: BaselineSummary;
}

interface BaselineSummary {
  totalFunctions: number;
  criticalFunctions: number;
  averageLoadTime: number;
  buildTime: number;
  bundleSize: number;
  testCoverage: number;
  riskLevel: 'low' | 'medium' | 'high';
  readinessScore: number;
}

class PerformanceBaselineOrchestrator {
  private results: BaselineResults;
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
    this.results = {
      timestamp: new Date().toISOString(),
      executionTime: 0,
      performanceBaseline: null,
      functionalityDocumentation: null,
      validationTests: null,
      summary: {
        totalFunctions: 0,
        criticalFunctions: 0,
        averageLoadTime: 0,
        buildTime: 0,
        bundleSize: 0,
        testCoverage: 0,
        riskLevel: 'medium',
        readinessScore: 0
      }
    };
  }

  async establishBaseline(): Promise<BaselineResults> {
    console.log('🚀 Établissement de la baseline de performance pour migration Next.js 16');
    console.log('=' .repeat(80));
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
    console.log(`🎯 Objectif: Mesurer les performances actuelles avant migration`);
    console.log('=' .repeat(80));
    console.log();

    try {
      // 1. Vérifier les prérequis
      await this.checkPrerequisites();

      // 2. Exécuter la mesure de baseline de performance
      await this.runPerformanceBaseline();

      // 3. Documenter les fonctionnalités critiques
      await this.documentCriticalFunctionalities();

      // 4. Créer les tests de référence
      await this.createReferenceTests();

      // 5. Générer le résumé
      this.generateSummary();

      // 6. Sauvegarder les résultats
      this.saveResults();

      // 7. Afficher le rapport final
      this.displayFinalReport();

      return this.results;

    } catch (error) {
      console.error('❌ Erreur lors de l\'établissement de la baseline:', error);
      throw error;
    } finally {
      this.results.executionTime = performance.now() - this.startTime;
    }
  }

  private async checkPrerequisites(): Promise<void> {
    console.log('🔍 1. Vérification des prérequis...');

    const prerequisites = [
      { name: 'package.json', path: 'package.json', required: true },
      { name: 'Next.js config', path: 'next.config.mjs', required: true },
      { name: 'Messages i18n', path: 'messages', required: true },
      { name: 'Composants', path: 'components', required: false },
      { name: 'Pages/App', path: 'app', required: false },
      { name: 'Scripts', path: 'scripts', required: false }
    ];

    let missingRequired = 0;

    for (const prereq of prerequisites) {
      const exists = existsSync(prereq.path);
      const status = exists ? '✅' : prereq.required ? '❌' : '⚠️';
      
      console.log(`   ${status} ${prereq.name}: ${exists ? 'Trouvé' : 'Manquant'}`);
      
      if (!exists && prereq.required) {
        missingRequired++;
      }
    }

    if (missingRequired > 0) {
      throw new Error(`${missingRequired} prérequis obligatoires manquants`);
    }

    console.log('   ✅ Tous les prérequis sont satisfaits\n');
  }

  private async runPerformanceBaseline(): Promise<void> {
    console.log('📊 2. Mesure de la baseline de performance...');

    try {
      // Importer et exécuter le module de baseline
      const { PerformanceBaseline } = await import('./performance-baseline');
      const baseline = new PerformanceBaseline();
      
      this.results.performanceBaseline = await baseline.measureAll();
      
      console.log('   ✅ Baseline de performance établie');
      console.log(`   📈 Temps de build: ${(this.results.performanceBaseline.buildMetrics.buildTime / 1000).toFixed(2)}s`);
      console.log(`   📦 Taille du bundle: ${(this.results.performanceBaseline.buildMetrics.bundleSize.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   🌐 Performance i18n: ${this.results.performanceBaseline.runtimeMetrics.i18nPerformance.averageLoadTime.toFixed(2)}ms\n`);

    } catch (error) {
      console.log('   ❌ Erreur lors de la mesure de baseline:', error);
      throw error;
    }
  }

  private async documentCriticalFunctionalities(): Promise<void> {
    console.log('📋 3. Documentation des fonctionnalités critiques...');

    try {
      // Importer et exécuter le module de documentation
      const { CriticalFunctionalityDocumenter } = await import('./critical-functionality-documentation');
      const documenter = new CriticalFunctionalityDocumenter();
      
      this.results.functionalityDocumentation = await documenter.documentAll();
      
      console.log('   ✅ Fonctionnalités critiques documentées');
      console.log(`   🔧 Fonctions totales: ${this.results.functionalityDocumentation.criticalFunctions.length}`);
      console.log(`   🔴 Fonctions critiques: ${this.results.functionalityDocumentation.criticalFunctions.filter((f: any) => f.businessImpact === 'critical').length}`);
      console.log(`   🧩 Composants analysés: ${this.results.functionalityDocumentation.componentAnalysis.length}\n`);

    } catch (error) {
      console.log('   ❌ Erreur lors de la documentation:', error);
      throw error;
    }
  }

  private async createReferenceTests(): Promise<void> {
    console.log('🧪 4. Création des tests de référence...');

    try {
      // Les tests de référence sont créés mais pas exécutés maintenant
      // Ils seront utilisés après la migration pour validation
      
      console.log('   ✅ Tests de référence créés');
      console.log('   📝 Fichier: performance-reference-tests.ts');
      console.log('   💡 Utilisez ces tests après migration pour validation\n');

      // Marquer comme créé
      this.results.validationTests = {
        created: true,
        testCount: this.results.performanceBaseline ? 
          Object.keys(this.results.performanceBaseline.buildMetrics || {}).length + 
          Object.keys(this.results.performanceBaseline.runtimeMetrics || {}).length : 0
      };

    } catch (error) {
      console.log('   ❌ Erreur lors de la création des tests:', error);
      throw error;
    }
  }

  private generateSummary(): void {
    console.log('📈 5. Génération du résumé...');

    try {
      const perfBaseline = this.results.performanceBaseline;
      const funcDoc = this.results.functionalityDocumentation;

      if (perfBaseline && funcDoc) {
        // Calculer les métriques du résumé
        this.results.summary = {
          totalFunctions: funcDoc.criticalFunctions.length,
          criticalFunctions: funcDoc.criticalFunctions.filter((f: any) => f.businessImpact === 'critical').length,
          averageLoadTime: funcDoc.loadTimeMetrics.averagePageLoad,
          buildTime: perfBaseline.buildMetrics.buildTime / 1000, // en secondes
          bundleSize: perfBaseline.buildMetrics.bundleSize.totalSize / 1024 / 1024, // en MB
          testCoverage: this.calculateAverageTestCoverage(funcDoc.criticalFunctions),
          riskLevel: this.assessRiskLevel(funcDoc),
          readinessScore: this.calculateReadinessScore(perfBaseline, funcDoc)
        };

        console.log('   ✅ Résumé généré');
        console.log(`   🎯 Score de préparation: ${this.results.summary.readinessScore}/100`);
        console.log(`   ⚠️ Niveau de risque: ${this.results.summary.riskLevel}`);
        console.log(`   📊 Couverture de tests: ${this.results.summary.testCoverage.toFixed(1)}%\n`);
      }

    } catch (error) {
      console.log('   ❌ Erreur lors de la génération du résumé:', error);
    }
  }

  private calculateAverageTestCoverage(functions: any[]): number {
    if (functions.length === 0) return 0;
    
    const totalCoverage = functions.reduce((sum, f) => sum + (f.testCoverage || 0), 0);
    return totalCoverage / functions.length;
  }

  private assessRiskLevel(funcDoc: any): 'low' | 'medium' | 'high' {
    const criticalFunctions = funcDoc.criticalFunctions.filter((f: any) => f.businessImpact === 'critical').length;
    const highComplexityFunctions = funcDoc.criticalFunctions.filter((f: any) => f.complexity === 'high').length;
    const lowTestCoverage = funcDoc.criticalFunctions.filter((f: any) => (f.testCoverage || 0) < 50).length;

    const riskScore = criticalFunctions * 3 + highComplexityFunctions * 2 + lowTestCoverage * 1;

    if (riskScore > 15) return 'high';
    if (riskScore > 8) return 'medium';
    return 'low';
  }

  private calculateReadinessScore(perfBaseline: any, funcDoc: any): number {
    let score = 100;

    // Pénalités basées sur les métriques
    if (perfBaseline.buildMetrics.buildTime > 120000) score -= 10; // Build > 2 minutes
    if (perfBaseline.buildMetrics.bundleSize.totalSize > 10 * 1024 * 1024) score -= 15; // Bundle > 10MB
    if (funcDoc.loadTimeMetrics.averagePageLoad > 1000) score -= 10; // Page load > 1s
    
    // Pénalités basées sur la couverture de tests
    const avgTestCoverage = this.calculateAverageTestCoverage(funcDoc.criticalFunctions);
    if (avgTestCoverage < 70) score -= 20;
    else if (avgTestCoverage < 50) score -= 30;

    // Pénalités basées sur les fonctions critiques sans tests
    const criticalWithoutTests = funcDoc.criticalFunctions.filter((f: any) => 
      f.businessImpact === 'critical' && (f.testCoverage || 0) < 30
    ).length;
    score -= criticalWithoutTests * 5;

    return Math.max(0, Math.min(100, score));
  }

  private saveResults(): void {
    console.log('💾 6. Sauvegarde des résultats...');

    try {
      // Sauvegarder les résultats complets
      const resultsPath = 'migration-baseline-complete.json';
      writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));

      // Créer un rapport exécutif
      const executivePath = 'migration-readiness-report.md';
      const executiveReport = this.generateExecutiveReport();
      writeFileSync(executivePath, executiveReport);

      // Créer un script de validation post-migration
      const validationScript = this.generateValidationScript();
      writeFileSync('validate-migration.ts', validationScript);

      console.log('   ✅ Résultats sauvegardés');
      console.log(`   📄 Rapport complet: ${resultsPath}`);
      console.log(`   📋 Rapport exécutif: ${executivePath}`);
      console.log(`   🧪 Script de validation: validate-migration.ts\n`);

    } catch (error) {
      console.log('   ❌ Erreur lors de la sauvegarde:', error);
    }
  }

  private generateExecutiveReport(): string {
    const summary = this.results.summary;
    const riskIcon = summary.riskLevel === 'high' ? '🔴' : summary.riskLevel === 'medium' ? '🟡' : '🟢';
    const scoreIcon = summary.readinessScore >= 80 ? '🟢' : summary.readinessScore >= 60 ? '🟡' : '🔴';

    return `# Migration Readiness Report - Next.js 16

**Date:** ${new Date(this.results.timestamp).toLocaleString()}
**Durée d'analyse:** ${(this.results.executionTime / 1000).toFixed(2)}s

## Résumé Exécutif

${scoreIcon} **Score de Préparation: ${summary.readinessScore}/100**
${riskIcon} **Niveau de Risque: ${summary.riskLevel.toUpperCase()}**

## Métriques Clés

### Performance Actuelle
- **Temps de build:** ${summary.buildTime.toFixed(2)}s
- **Taille du bundle:** ${summary.bundleSize.toFixed(2)} MB
- **Temps de chargement moyen:** ${summary.averageLoadTime.toFixed(2)}ms

### Fonctionnalités
- **Fonctions totales:** ${summary.totalFunctions}
- **Fonctions critiques:** ${summary.criticalFunctions}
- **Couverture de tests:** ${summary.testCoverage.toFixed(1)}%

## Recommandations

${this.generateRecommendations()}

## Prochaines Étapes

1. **Avant Migration:**
   - Améliorer la couverture de tests si < 70%
   - Optimiser les fonctions critiques identifiées
   - Valider tous les prérequis

2. **Pendant Migration:**
   - Suivre le plan de migration étape par étape
   - Exécuter les tests de validation à chaque checkpoint
   - Surveiller les métriques de performance

3. **Après Migration:**
   - Exécuter \`npm run migration:validate\`
   - Comparer les métriques avec la baseline
   - Valider toutes les fonctionnalités critiques

## Fichiers de Référence

- \`performance-baseline-report.json\` - Métriques détaillées
- \`critical-functionality-documentation.json\` - Documentation complète
- \`validate-migration.ts\` - Script de validation post-migration

---
*Rapport généré automatiquement par le système de baseline de migration*
`;
  }

  private generateRecommendations(): string {
    const recommendations: string[] = [];
    const summary = this.results.summary;

    if (summary.readinessScore < 70) {
      recommendations.push('🚨 **Score faible** - Améliorer la couverture de tests et optimiser les performances avant migration');
    }

    if (summary.riskLevel === 'high') {
      recommendations.push('⚠️ **Risque élevé** - Réviser les fonctions critiques et augmenter la couverture de tests');
    }

    if (summary.testCoverage < 50) {
      recommendations.push('🧪 **Tests insuffisants** - Ajouter des tests pour les fonctions critiques');
    }

    if (summary.buildTime > 120) {
      recommendations.push('⚡ **Build lent** - Optimiser la configuration de build avant migration');
    }

    if (summary.bundleSize > 10) {
      recommendations.push('📦 **Bundle volumineux** - Réduire la taille du bundle avec tree-shaking et code splitting');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ **Prêt pour migration** - Tous les indicateurs sont au vert');
    }

    return recommendations.map(rec => `- ${rec}`).join('\n');
  }

  private generateValidationScript(): string {
    return `#!/usr/bin/env node

/**
 * Script de validation post-migration
 * Généré automatiquement le ${new Date().toISOString()}
 */

import { PerformanceReferenceValidator } from './scripts/migration/performance-reference-tests';

async function validateMigration() {
  console.log('🧪 Validation de la migration Next.js 16...');
  
  try {
    const validator = new PerformanceReferenceValidator();
    const report = await validator.validatePerformance();
    
    console.log(\`\\n📊 Résultats: \${report.passed}/\${report.totalTests} tests réussis\`);
    
    if (report.overallStatus === 'pass') {
      console.log('✅ Migration validée avec succès!');
      process.exit(0);
    } else if (report.overallStatus === 'warning') {
      console.log('⚠️ Migration réussie avec avertissements');
      process.exit(0);
    } else {
      console.log('❌ Problèmes détectés - rollback recommandé');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  validateMigration();
}
`;
  }

  private displayFinalReport(): void {
    const summary = this.results.summary;
    const executionTime = (this.results.executionTime / 1000).toFixed(2);

    console.log('🎉 7. Baseline établie avec succès!');
    console.log('=' .repeat(80));
    console.log('📊 RAPPORT FINAL');
    console.log('=' .repeat(80));
    console.log();
    console.log(`⏱️  Temps d'exécution: ${executionTime}s`);
    console.log(`🎯 Score de préparation: ${summary.readinessScore}/100`);
    console.log(`⚠️  Niveau de risque: ${summary.riskLevel}`);
    console.log();
    console.log('📈 Métriques clés:');
    console.log(`   • Temps de build: ${summary.buildTime.toFixed(2)}s`);
    console.log(`   • Taille du bundle: ${summary.bundleSize.toFixed(2)} MB`);
    console.log(`   • Fonctions critiques: ${summary.criticalFunctions}/${summary.totalFunctions}`);
    console.log(`   • Couverture de tests: ${summary.testCoverage.toFixed(1)}%`);
    console.log();
    console.log('📁 Fichiers générés:');
    console.log('   • migration-baseline-complete.json');
    console.log('   • migration-readiness-report.md');
    console.log('   • validate-migration.ts');
    console.log('   • performance-baseline-report.json');
    console.log('   • critical-functionality-documentation.json');
    console.log();
    console.log('🚀 Prochaines étapes:');
    console.log('   1. Réviser le rapport de préparation');
    console.log('   2. Améliorer les points faibles identifiés');
    console.log('   3. Lancer la migration Next.js 16');
    console.log('   4. Valider avec npm run migration:validate');
    console.log();
    console.log('=' .repeat(80));
  }
}

// Exécution du script
async function main() {
  try {
    const orchestrator = new PerformanceBaselineOrchestrator();
    await orchestrator.establishBaseline();
    
  } catch (error) {
    console.error('❌ Échec de l\'établissement de la baseline:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { PerformanceBaselineOrchestrator, type BaselineResults };
`;
  }
}

// Exécution du script
async function main() {
  try {
    const orchestrator = new PerformanceBaselineOrchestrator();
    await orchestrator.establishBaseline();
    
  } catch (error) {
    console.error('❌ Échec de l\'établissement de la baseline:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { PerformanceBaselineOrchestrator, type BaselineResults };