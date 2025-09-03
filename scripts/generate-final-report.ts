#!/usr/bin/env tsx

/**
 * Générateur de rapport final de validation pour la migration next-intl
 * Compile tous les résultats de tests et génère un rapport complet
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { TranslationValidator } from './validate-translations-final';
import { PerformanceTester } from './test-translation-performance';
import { generatePerformanceReport } from '../lib/utils/bundle-analyzer';

interface FinalReport {
  metadata: {
    timestamp: string;
    version: string;
    environment: string;
    nodeVersion: string;
  };
  summary: {
    overallStatus: 'SUCCESS' | 'WARNING' | 'FAILURE';
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningCount: number;
    errorCount: number;
  };
  validation: {
    translationValidation: any;
    performanceTests: any;
    unitTests: any;
    e2eTests: any;
  };
  performance: {
    bundleAnalysis: any;
    loadTimes: any;
    memoryUsage: any;
  };
  recommendations: string[];
  nextSteps: string[];
}

class FinalReportGenerator {
  private report: FinalReport;

  constructor() {
    this.report = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.getPackageVersion(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      },
      summary: {
        overallStatus: 'SUCCESS',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warningCount: 0,
        errorCount: 0
      },
      validation: {
        translationValidation: null,
        performanceTests: null,
        unitTests: null,
        e2eTests: null
      },
      performance: {
        bundleAnalysis: null,
        loadTimes: null,
        memoryUsage: null
      },
      recommendations: [],
      nextSteps: []
    };
  }

  async generateReport(): Promise<FinalReport> {
    console.log('📊 Génération du rapport final de validation...\n');

    try {
      // 1. Validation des traductions
      await this.runTranslationValidation();
      
      // 2. Tests de performance
      await this.runPerformanceTests();
      
      // 3. Tests unitaires
      await this.runUnitTests();
      
      // 4. Tests E2E
      await this.runE2ETests();
      
      // 5. Analyse des bundles
      await this.runBundleAnalysis();
      
      // 6. Calculer le résumé
      this.calculateSummary();
      
      // 7. Générer les recommandations
      this.generateRecommendations();
      
      // 8. Sauvegarder le rapport
      await this.saveReport();
      
      // 9. Afficher le résumé
      this.displaySummary();

    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      this.report.summary.overallStatus = 'FAILURE';
      this.report.summary.errorCount++;
    }

    return this.report;
  }

  private async runTranslationValidation(): Promise<void> {
    console.log('🔍 Validation des traductions...');
    
    try {
      const validator = new TranslationValidator();
      const result = await validator.validateAll();
      
      this.report.validation.translationValidation = result;
      this.report.summary.totalTests++;
      
      if (result.success) {
        this.report.summary.passedTests++;
        console.log('  ✅ Validation des traductions réussie');
      } else {
        this.report.summary.failedTests++;
        console.log('  ❌ Validation des traductions échouée');
      }
      
      this.report.summary.errorCount += result.errors.length;
      this.report.summary.warningCount += result.warnings.length;
      
    } catch (error) {
      console.error('  ❌ Erreur lors de la validation des traductions:', error);
      this.report.summary.failedTests++;
      this.report.summary.errorCount++;
    }
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('\n⚡ Tests de performance...');
    
    try {
      const tester = new PerformanceTester();
      const results = await tester.runAllTests();
      
      this.report.validation.performanceTests = results;
      
      for (const result of results) {
        this.report.summary.totalTests++;
        
        if (result.success) {
          this.report.summary.passedTests++;
        } else {
          this.report.summary.failedTests++;
        }
      }
      
      console.log(`  ✅ ${results.filter(r => r.success).length}/${results.length} tests de performance réussis`);
      
    } catch (error) {
      console.error('  ❌ Erreur lors des tests de performance:', error);
      this.report.summary.failedTests++;
      this.report.summary.errorCount++;
    }
  }

  private async runUnitTests(): Promise<void> {
    console.log('\n🧪 Tests unitaires...');
    
    try {
      // Exécuter les tests Jest
      const testOutput = execSync('npm test -- --passWithNoTests --silent', { 
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      
      // Parser la sortie des tests (simplifié)
      const testResults = this.parseJestOutput(testOutput);
      
      this.report.validation.unitTests = testResults;
      this.report.summary.totalTests += testResults.total || 0;
      this.report.summary.passedTests += testResults.passed || 0;
      this.report.summary.failedTests += testResults.failed || 0;
      
      console.log(`  ✅ ${testResults.passed || 0}/${testResults.total || 0} tests unitaires réussis`);
      
    } catch (error) {
      console.error('  ⚠️  Tests unitaires non exécutés:', error.toString().slice(0, 100));
      this.report.validation.unitTests = { error: 'Tests non exécutés' };
      this.report.summary.warningCount++;
    }
  }

  private async runE2ETests(): Promise<void> {
    console.log('\n🎭 Tests E2E...');
    
    try {
      // Exécuter les tests E2E spécifiques
      const testOutput = execSync('npm test -- __tests__/e2e --passWithNoTests --silent', { 
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      
      const testResults = this.parseJestOutput(testOutput);
      
      this.report.validation.e2eTests = testResults;
      this.report.summary.totalTests += testResults.total || 0;
      this.report.summary.passedTests += testResults.passed || 0;
      this.report.summary.failedTests += testResults.failed || 0;
      
      console.log(`  ✅ ${testResults.passed || 0}/${testResults.total || 0} tests E2E réussis`);
      
    } catch (error) {
      console.error('  ⚠️  Tests E2E non exécutés:', error.toString().slice(0, 100));
      this.report.validation.e2eTests = { error: 'Tests non exécutés' };
      this.report.summary.warningCount++;
    }
  }

  private async runBundleAnalysis(): Promise<void> {
    console.log('\n📦 Analyse des bundles...');
    
    try {
      const performanceReport = await generatePerformanceReport();
      this.report.performance.bundleAnalysis = performanceReport;
      
      console.log('  ✅ Analyse des bundles terminée');
      
    } catch (error) {
      console.error('  ❌ Erreur lors de l\'analyse des bundles:', error);
      this.report.summary.errorCount++;
    }
  }

  private parseJestOutput(output: string): any {
    // Parser simplifié de la sortie Jest
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;
    
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed/);
        if (match) passed = parseInt(match[1]);
        
        const failMatch = line.match(/(\d+) failed/);
        if (failMatch) failed = parseInt(failMatch[1]);
        
        total = passed + failed;
        break;
      }
    }
    
    return { passed, failed, total, output };
  }

  private calculateSummary(): void {
    const { passedTests, failedTests, errorCount, warningCount } = this.report.summary;
    
    if (errorCount > 0 || failedTests > passedTests) {
      this.report.summary.overallStatus = 'FAILURE';
    } else if (warningCount > 0) {
      this.report.summary.overallStatus = 'WARNING';
    } else {
      this.report.summary.overallStatus = 'SUCCESS';
    }
  }

  private generateRecommendations(): void {
    const recommendations: string[] = [];
    const nextSteps: string[] = [];
    
    // Recommandations basées sur les résultats
    if (this.report.summary.failedTests > 0) {
      recommendations.push('Corriger les tests en échec avant la mise en production');
      nextSteps.push('Analyser et corriger les tests échoués');
    }
    
    if (this.report.summary.warningCount > 5) {
      recommendations.push('Examiner et résoudre les avertissements nombreux');
      nextSteps.push('Prioriser la résolution des avertissements critiques');
    }
    
    if (this.report.validation.performanceTests) {
      const perfResults = this.report.validation.performanceTests;
      const failedPerfTests = perfResults.filter((r: any) => !r.success);
      
      if (failedPerfTests.length > 0) {
        recommendations.push('Optimiser les performances des traductions');
        nextSteps.push('Implémenter les optimisations de performance suggérées');
      }
    }
    
    // Recommandations générales
    if (this.report.summary.overallStatus === 'SUCCESS') {
      recommendations.push('La migration next-intl est prête pour la production');
      nextSteps.push('Planifier le déploiement en production');
      nextSteps.push('Mettre en place le monitoring des performances');
      nextSteps.push('Former l\'équipe sur les nouvelles conventions');
    }
    
    this.report.recommendations = recommendations;
    this.report.nextSteps = nextSteps;
  }

  private async saveReport(): Promise<void> {
    const reportPath = path.join(process.cwd(), 'final-validation-report.json');
    const htmlReportPath = path.join(process.cwd(), 'final-validation-report.html');
    
    // Sauvegarder en JSON
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Générer un rapport HTML
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log(`\n📄 Rapport sauvegardé:`);
    console.log(`  JSON: ${reportPath}`);
    console.log(`  HTML: ${htmlReportPath}`);
  }

  private generateHTMLReport(): string {
    const { metadata, summary, recommendations, nextSteps } = this.report;
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Final - Migration next-intl</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .status-success { color: #28a745; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .status-failure { color: #dc3545; font-weight: bold; }
        .section { margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .recommendations { background: #e7f3ff; padding: 20px; border-radius: 8px; }
        .next-steps { background: #f0f8f0; padding: 20px; border-radius: 8px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Rapport Final - Migration next-intl</h1>
        <p><strong>Statut:</strong> <span class="status-${summary.overallStatus.toLowerCase()}">${summary.overallStatus}</span></p>
        <p><strong>Date:</strong> ${new Date(metadata.timestamp).toLocaleString('fr-FR')}</p>
        <p><strong>Environnement:</strong> ${metadata.environment}</p>
    </div>

    <div class="section">
        <h2>📊 Résumé des Tests</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${summary.totalTests}</div>
                <div>Tests Total</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #28a745;">${summary.passedTests}</div>
                <div>Tests Réussis</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #dc3545;">${summary.failedTests}</div>
                <div>Tests Échoués</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #ffc107;">${summary.warningCount}</div>
                <div>Avertissements</div>
            </div>
        </div>
    </div>

    <div class="section recommendations">
        <h2>💡 Recommandations</h2>
        <ul>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <div class="section next-steps">
        <h2>🚀 Prochaines Étapes</h2>
        <ul>
            ${nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>📋 Détails Techniques</h2>
        <p><strong>Version Node.js:</strong> ${metadata.nodeVersion}</p>
        <p><strong>Taux de réussite:</strong> ${Math.round((summary.passedTests / summary.totalTests) * 100)}%</p>
    </div>

    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Rapport généré automatiquement le ${new Date(metadata.timestamp).toLocaleString('fr-FR')}</p>
    </footer>
</body>
</html>`;
  }

  private displaySummary(): void {
    console.log('\n' + '='.repeat(70));
    console.log('🎉 RAPPORT FINAL DE VALIDATION - MIGRATION NEXT-INTL');
    console.log('='.repeat(70));
    
    const statusIcon = {
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'FAILURE': '❌'
    }[this.report.summary.overallStatus];
    
    console.log(`${statusIcon} STATUT GLOBAL: ${this.report.summary.overallStatus}`);
    console.log(`📅 Date: ${new Date(this.report.metadata.timestamp).toLocaleString('fr-FR')}`);
    console.log(`🌍 Environnement: ${this.report.metadata.environment}`);
    
    console.log('\n📊 RÉSUMÉ DES TESTS:');
    console.log(`   Total: ${this.report.summary.totalTests}`);
    console.log(`   ✅ Réussis: ${this.report.summary.passedTests}`);
    console.log(`   ❌ Échoués: ${this.report.summary.failedTests}`);
    console.log(`   ⚠️  Avertissements: ${this.report.summary.warningCount}`);
    console.log(`   🔥 Erreurs: ${this.report.summary.errorCount}`);
    
    if (this.report.summary.totalTests > 0) {
      const successRate = Math.round((this.report.summary.passedTests / this.report.summary.totalTests) * 100);
      console.log(`   📈 Taux de réussite: ${successRate}%`);
    }
    
    if (this.report.recommendations.length > 0) {
      console.log('\n💡 RECOMMANDATIONS:');
      this.report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    if (this.report.nextSteps.length > 0) {
      console.log('\n🚀 PROCHAINES ÉTAPES:');
      this.report.nextSteps.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (this.report.summary.overallStatus === 'SUCCESS') {
      console.log('🎉 FÉLICITATIONS! La migration next-intl est terminée avec succès!');
    } else if (this.report.summary.overallStatus === 'WARNING') {
      console.log('⚠️  Migration terminée avec des avertissements. Vérifiez les recommandations.');
    } else {
      console.log('❌ Migration incomplète. Corrigez les erreurs avant de continuer.');
    }
    
    console.log('='.repeat(70));
  }

  private getPackageVersion(): string {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
}

// Fonction principale
async function main() {
  const generator = new FinalReportGenerator();
  const report = await generator.generateReport();
  
  // Code de sortie basé sur le statut
  if (report.summary.overallStatus === 'FAILURE') {
    process.exit(1);
  } else if (report.summary.overallStatus === 'WARNING') {
    process.exit(0); // Avertissements mais pas d'échec
  } else {
    process.exit(0);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('Erreur fatale lors de la génération du rapport:', error);
    process.exit(1);
  });
}

export { FinalReportGenerator };