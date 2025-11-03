#!/usr/bin/env tsx

/**
 * Partner System Test Runner
 * Executes all partner system tests efficiently
 */

import { execSync } from 'child_process';

interface TestSuite {
  name: string;
  path: string;
  description: string;
  critical: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: 'Core Integration',
    path: 'tests/integration/partner-system-core.test.ts',
    description: 'Core partner system functionality tests',
    critical: true
  },
  {
    name: 'Security',
    path: 'tests/security/partner-security.test.ts',
    description: 'Security and data protection tests',
    critical: true
  },
  {
    name: 'Performance',
    path: 'tests/performance/partner-performance.test.ts',
    description: 'Performance and optimization tests',
    critical: false
  },
  {
    name: 'System Validation',
    path: 'tests/integration/partner-system-validation.test.ts',
    description: 'System integration validation tests',
    critical: true
  }
];

class PartnerTestRunner {
  private results: Array<{
    suite: string;
    passed: boolean;
    duration: number;
    tests: number;
    errors?: string;
  }> = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Démarrage des tests du système partenaire...\n');

    const startTime = Date.now();

    // Run critical tests first
    const criticalSuites = testSuites.filter(suite => suite.critical);
    const nonCriticalSuites = testSuites.filter(suite => !suite.critical);

    console.log('📋 Tests critiques:');
    for (const suite of criticalSuites) {
      await this.runTestSuite(suite);
    }

    console.log('\n📊 Tests de performance:');
    for (const suite of nonCriticalSuites) {
      await this.runTestSuite(suite);
    }

    const totalTime = Date.now() - startTime;
    this.generateReport(totalTime);
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`  🧪 ${suite.name}...`);
    
    const startTime = Date.now();
    
    try {
      const output = execSync(
        `npx vitest run ${suite.path} --run --reporter=json`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );

      const duration = Date.now() - startTime;
      const result = this.parseTestOutput(output);

      this.results.push({
        suite: suite.name,
        passed: true,
        duration,
        tests: result.tests,
        errors: undefined
      });

      console.log(`     ✅ ${result.tests} tests passés (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        tests: 0,
        errors: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      console.log(`     ❌ Échec (${duration}ms)`);
      
      if (suite.critical) {
        console.log(`     ⚠️  Test critique échoué: ${suite.name}`);
      }
    }
  }

  private parseTestOutput(output: string): { tests: number; passed: number; failed: number } {
    try {
      // Try to parse JSON output
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));
      
      if (jsonLine) {
        const result = JSON.parse(jsonLine);
        return {
          tests: result.numTotalTests || 0,
          passed: result.numPassedTests || 0,
          failed: result.numFailedTests || 0
        };
      }
    } catch {
      // Fallback to regex parsing
      const testMatch = output.match(/(\d+) passed/);
      const tests = testMatch ? parseInt(testMatch[1]) : 0;
      
      return { tests, passed: tests, failed: 0 };
    }

    return { tests: 0, passed: 0, failed: 0 };
  }

  private generateReport(totalTime: number): void {
    console.log('\n📊 Rapport des tests du système partenaire');
    console.log('==========================================\n');

    const totalTests = this.results.reduce((sum, result) => sum + result.tests, 0);
    const passedSuites = this.results.filter(result => result.passed).length;
    const failedSuites = this.results.filter(result => !result.passed).length;
    const criticalFailures = this.results.filter(result => 
      !result.passed && testSuites.find(suite => suite.name === result.suite)?.critical
    ).length;

    // Summary
    console.log(`📈 Résumé:`);
    console.log(`   Total des tests: ${totalTests}`);
    console.log(`   Suites réussies: ${passedSuites}/${this.results.length}`);
    console.log(`   Temps total: ${totalTime}ms`);
    console.log(`   Échecs critiques: ${criticalFailures}`);
    console.log('');

    // Detailed results
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const critical = testSuites.find(suite => suite.name === result.suite)?.critical ? ' (CRITIQUE)' : '';
      
      console.log(`${status} ${result.suite}${critical}:`);
      console.log(`   Tests: ${result.tests}`);
      console.log(`   Durée: ${result.duration}ms`);
      
      if (result.errors) {
        console.log(`   Erreur: ${result.errors.split('\n')[0]}`);
      }
      console.log('');
    });

    // Final status
    if (criticalFailures > 0) {
      console.log('❌ ÉCHEC: Des tests critiques ont échoué');
      console.log('   Le système partenaire n\'est pas prêt pour le déploiement');
      process.exit(1);
    } else if (failedSuites > 0) {
      console.log('⚠️  AVERTISSEMENT: Certains tests non-critiques ont échoué');
      console.log('   Le système partenaire est fonctionnel mais nécessite des améliorations');
    } else {
      console.log('🎉 SUCCÈS: Tous les tests sont passés!');
      console.log('   Le système partenaire est prêt pour le déploiement');
    }

    // Performance insights
    const avgDuration = totalTime / this.results.length;
    if (avgDuration > 1000) {
      console.log('\n⚡ Suggestion: Optimiser les tests pour de meilleures performances');
    }
  }
}

// Run tests if this script is executed directly
const runner = new PartnerTestRunner();
runner.runAllTests().catch(error => {
  console.error('❌ Échec du runner de tests:', error);
  process.exit(1);
});

export { PartnerTestRunner };