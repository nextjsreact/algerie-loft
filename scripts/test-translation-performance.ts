#!/usr/bin/env tsx

/**
 * Script de test de performance des traductions next-intl
 * Mesure les temps de chargement, la taille des bundles et l'efficacité du cache
 */

import { performance } from 'perf_hooks';
import { 
  getMessages, 
  preloadAllMessages, 
  getCacheStats, 
  cleanupCache,
  preloadRouteTranslations,
  getNamespacesForRoute 
} from '../lib/i18n-optimizations';
import { 
  getClientCacheStats, 
  clearTranslationCache 
} from '../lib/hooks/use-cached-translations';
import { analyzeTranslationBundles } from '../lib/utils/bundle-analyzer';

interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  bundleSize: number;
  memoryUsage: number;
}

interface TestResult {
  test: string;
  success: boolean;
  metrics: PerformanceMetrics;
  details: any;
}

class PerformanceTester {
  private results: TestResult[] = [];
  private locales = ['fr', 'en', 'ar'] as const;

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Démarrage des tests de performance...\n');

    try {
      // 1. Test de chargement initial
      await this.testInitialLoading();
      
      // 2. Test de cache performance
      await this.testCachePerformance();
      
      // 3. Test de lazy loading
      await this.testLazyLoading();
      
      // 4. Test de préchargement
      await this.testPreloading();
      
      // 5. Test de bundle size
      await this.testBundleSize();
      
      // 6. Test de mémoire
      await this.testMemoryUsage();
      
      // 7. Test de stress
      await this.testStressLoad();

      // Afficher le résumé
      this.displayResults();

    } catch (error) {
      console.error('Erreur lors des tests de performance:', error);
    }

    return this.results;
  }

  private async testInitialLoading(): Promise<void> {
    console.log('📥 Test de chargement initial...');
    
    const startTime = performance.now();
    
    try {
      // Nettoyer le cache pour un test propre
      clearTranslationCache();
      cleanupCache(0);
      
      // Charger toutes les traductions
      await Promise.all(
        this.locales.map(locale => getMessages(locale))
      );
      
      const loadTime = performance.now() - startTime;
      const cacheStats = getCacheStats();
      
      this.results.push({
        test: 'Initial Loading',
        success: loadTime < 2000, // Seuil: 2 secondes
        metrics: {
          loadTime,
          cacheHitRate: 0, // Premier chargement
          bundleSize: 0, // Sera calculé plus tard
          memoryUsage: process.memoryUsage().heapUsed
        },
        details: {
          cacheEntries: cacheStats.size,
          localesLoaded: this.locales.length
        }
      });
      
      console.log(`  ✅ Temps de chargement: ${Math.round(loadTime)}ms`);
      console.log(`  ✅ Entrées en cache: ${cacheStats.size}`);
      
    } catch (error) {
      this.results.push({
        test: 'Initial Loading',
        success: false,
        metrics: { loadTime: -1, cacheHitRate: 0, bundleSize: 0, memoryUsage: 0 },
        details: { error: error.toString() }
      });
    }
  }

  private async testCachePerformance(): Promise<void> {
    console.log('\n💾 Test de performance du cache...');
    
    try {
      // Premier chargement (cache miss)
      const startTime1 = performance.now();
      await getMessages('fr', ['common', 'nav']);
      const firstLoadTime = performance.now() - startTime1;
      
      // Deuxième chargement (cache hit)
      const startTime2 = performance.now();
      await getMessages('fr', ['common', 'nav']);
      const secondLoadTime = performance.now() - startTime2;
      
      const speedup = firstLoadTime / secondLoadTime;
      const cacheStats = getCacheStats();
      
      this.results.push({
        test: 'Cache Performance',
        success: speedup > 2, // Le cache devrait être au moins 2x plus rapide
        metrics: {
          loadTime: secondLoadTime,
          cacheHitRate: speedup,
          bundleSize: 0,
          memoryUsage: process.memoryUsage().heapUsed
        },
        details: {
          firstLoad: Math.round(firstLoadTime * 100) / 100,
          secondLoad: Math.round(secondLoadTime * 100) / 100,
          speedup: Math.round(speedup * 100) / 100,
          cacheSize: cacheStats.size
        }
      });
      
      console.log(`  ✅ Premier chargement: ${Math.round(firstLoadTime * 100) / 100}ms`);
      console.log(`  ✅ Deuxième chargement: ${Math.round(secondLoadTime * 100) / 100}ms`);
      console.log(`  ✅ Accélération: ${Math.round(speedup * 100) / 100}x`);
      
    } catch (error) {
      this.results.push({
        test: 'Cache Performance',
        success: false,
        metrics: { loadTime: -1, cacheHitRate: 0, bundleSize: 0, memoryUsage: 0 },
        details: { error: error.toString() }
      });
    }
  }

  private async testLazyLoading(): Promise<void> {
    console.log('\n🔄 Test de lazy loading...');
    
    try {
      // Nettoyer le cache
      cleanupCache(0);
      
      // Test de chargement par namespace
      const routes = ['/dashboard', '/lofts', '/transactions', '/reports'];
      const loadTimes: number[] = [];
      
      for (const route of routes) {
        const namespaces = getNamespacesForRoute(route);
        
        const startTime = performance.now();
        await getMessages('fr', namespaces);
        const loadTime = performance.now() - startTime;
        
        loadTimes.push(loadTime);
      }
      
      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      const maxLoadTime = Math.max(...loadTimes);
      
      this.results.push({
        test: 'Lazy Loading',
        success: maxLoadTime < 500, // Seuil: 500ms par route
        metrics: {
          loadTime: avgLoadTime,
          cacheHitRate: 0,
          bundleSize: 0,
          memoryUsage: process.memoryUsage().heapUsed
        },
        details: {
          routesTested: routes.length,
          avgLoadTime: Math.round(avgLoadTime * 100) / 100,
          maxLoadTime: Math.round(maxLoadTime * 100) / 100,
          loadTimes: loadTimes.map(t => Math.round(t * 100) / 100)
        }
      });
      
      console.log(`  ✅ Temps moyen: ${Math.round(avgLoadTime * 100) / 100}ms`);
      console.log(`  ✅ Temps maximum: ${Math.round(maxLoadTime * 100) / 100}ms`);
      
    } catch (error) {
      this.results.push({
        test: 'Lazy Loading',
        success: false,
        metrics: { loadTime: -1, cacheHitRate: 0, bundleSize: 0, memoryUsage: 0 },
        details: { error: error.toString() }
      });
    }
  }

  private async testPreloading(): Promise<void> {
    console.log('\n⚡ Test de préchargement...');
    
    try {
      // Nettoyer le cache
      cleanupCache(0);
      
      // Test de préchargement de route
      const startTime = performance.now();
      await preloadRouteTranslations('/dashboard', 'fr');
      const preloadTime = performance.now() - startTime;
      
      // Vérifier que le chargement suivant est plus rapide
      const startTime2 = performance.now();
      await getMessages('fr', getNamespacesForRoute('/dashboard'));
      const subsequentLoadTime = performance.now() - startTime2;
      
      this.results.push({
        test: 'Preloading',
        success: subsequentLoadTime < preloadTime / 2, // Devrait être plus rapide
        metrics: {
          loadTime: preloadTime,
          cacheHitRate: preloadTime / subsequentLoadTime,
          bundleSize: 0,
          memoryUsage: process.memoryUsage().heapUsed
        },
        details: {
          preloadTime: Math.round(preloadTime * 100) / 100,
          subsequentLoadTime: Math.round(subsequentLoadTime * 100) / 100
        }
      });
      
      console.log(`  ✅ Temps de préchargement: ${Math.round(preloadTime * 100) / 100}ms`);
      console.log(`  ✅ Temps de chargement suivant: ${Math.round(subsequentLoadTime * 100) / 100}ms`);
      
    } catch (error) {
      this.results.push({
        test: 'Preloading',
        success: false,
        metrics: { loadTime: -1, cacheHitRate: 0, bundleSize: 0, memoryUsage: 0 },
        details: { error: error.toString() }
      });
    }
  }

  private async testBundleSize(): Promise<void> {
    console.log('\n📦 Test de taille des bundles...');
    
    try {
      const analysis = await analyzeTranslationBundles();
      const totalSize = analysis.translationSize;
      const maxRecommendedSize = 200 * 1024; // 200KB
      
      this.results.push({
        test: 'Bundle Size',
        success: totalSize < maxRecommendedSize,
        metrics: {
          loadTime: 0,
          cacheHitRate: 0,
          bundleSize: totalSize,
          memoryUsage: process.memoryUsage().heapUsed
        },
        details: {
          totalSizeKB: Math.round(totalSize / 1024),
          maxRecommendedKB: Math.round(maxRecommendedSize / 1024),
          languageBreakdown: Object.fromEntries(
            Object.entries(analysis.languageBreakdown).map(([lang, size]) => [
              lang, 
              Math.round((size as number) / 1024)
            ])
          ),
          recommendations: analysis.recommendations
        }
      });
      
      console.log(`  ✅ Taille totale: ${Math.round(totalSize / 1024)}KB`);
      console.log(`  ✅ Seuil recommandé: ${Math.round(maxRecommendedSize / 1024)}KB`);
      
    } catch (error) {
      this.results.push({
        test: 'Bundle Size',
        success: false,
        metrics: { loadTime: -1, cacheHitRate: 0, bundleSize: 0, memoryUsage: 0 },
        details: { error: error.toString() }
      });
    }
  }

  private async testMemoryUsage(): Promise<void> {
    console.log('\n🧠 Test d\'utilisation mémoire...');
    
    try {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Charger beaucoup de traductions
      for (let i = 0; i < 10; i++) {
        for (const locale of this.locales) {
          await getMessages(locale);
        }
      }
      
      const peakMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = peakMemory - initialMemory;
      
      // Nettoyer le cache
      cleanupCache(10);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryAfterCleanup = finalMemory - initialMemory;
      
      const maxRecommendedIncrease = 50 * 1024 * 1024; // 50MB
      
      this.results.push({
        test: 'Memory Usage',
        success: memoryIncrease < maxRecommendedIncrease,
        metrics: {
          loadTime: 0,
          cacheHitRate: 0,
          bundleSize: 0,
          memoryUsage: memoryIncrease
        },
        details: {
          initialMemoryMB: Math.round(initialMemory / 1024 / 1024),
          peakMemoryMB: Math.round(peakMemory / 1024 / 1024),
          finalMemoryMB: Math.round(finalMemory / 1024 / 1024),
          memoryIncreaseMB: Math.round(memoryIncrease / 1024 / 1024),
          memoryAfterCleanupMB: Math.round(memoryAfterCleanup / 1024 / 1024),
          maxRecommendedMB: Math.round(maxRecommendedIncrease / 1024 / 1024)
        }
      });
      
      console.log(`  ✅ Augmentation mémoire: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      console.log(`  ✅ Après nettoyage: ${Math.round(memoryAfterCleanup / 1024 / 1024)}MB`);
      
    } catch (error) {
      this.results.push({
        test: 'Memory Usage',
        success: false,
        metrics: { loadTime: -1, cacheHitRate: 0, bundleSize: 0, memoryUsage: 0 },
        details: { error: error.toString() }
      });
    }
  }

  private async testStressLoad(): Promise<void> {
    console.log('\n🔥 Test de charge...');
    
    try {
      const iterations = 100;
      const startTime = performance.now();
      
      // Effectuer de nombreuses requêtes simultanées
      const promises = [];
      for (let i = 0; i < iterations; i++) {
        const locale = this.locales[i % this.locales.length];
        const namespaces = ['common', 'nav'];
        promises.push(getMessages(locale, namespaces));
      }
      
      await Promise.all(promises);
      
      const totalTime = performance.now() - startTime;
      const avgTimePerRequest = totalTime / iterations;
      
      this.results.push({
        test: 'Stress Load',
        success: avgTimePerRequest < 10, // Seuil: 10ms par requête
        metrics: {
          loadTime: avgTimePerRequest,
          cacheHitRate: 0,
          bundleSize: 0,
          memoryUsage: process.memoryUsage().heapUsed
        },
        details: {
          iterations,
          totalTimeMs: Math.round(totalTime * 100) / 100,
          avgTimePerRequestMs: Math.round(avgTimePerRequest * 100) / 100
        }
      });
      
      console.log(`  ✅ ${iterations} requêtes en ${Math.round(totalTime)}ms`);
      console.log(`  ✅ Temps moyen par requête: ${Math.round(avgTimePerRequest * 100) / 100}ms`);
      
    } catch (error) {
      this.results.push({
        test: 'Stress Load',
        success: false,
        metrics: { loadTime: -1, cacheHitRate: 0, bundleSize: 0, memoryUsage: 0 },
        details: { error: error.toString() }
      });
    }
  }

  private displayResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTATS DES TESTS DE PERFORMANCE');
    console.log('='.repeat(60));
    
    const successfulTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    
    console.log(`✅ Tests réussis: ${successfulTests}/${totalTests}`);
    console.log(`📈 Taux de réussite: ${Math.round((successfulTests / totalTests) * 100)}%`);
    
    console.log('\n📋 DÉTAIL DES TESTS:');
    
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      console.log(`\n${status} ${result.test}`);
      
      if (result.metrics.loadTime > 0) {
        console.log(`   Temps: ${Math.round(result.metrics.loadTime * 100) / 100}ms`);
      }
      
      if (result.metrics.bundleSize > 0) {
        console.log(`   Taille: ${Math.round(result.metrics.bundleSize / 1024)}KB`);
      }
      
      if (result.metrics.cacheHitRate > 0) {
        console.log(`   Cache: ${Math.round(result.metrics.cacheHitRate * 100) / 100}x`);
      }
      
      if (!result.success && result.details.error) {
        console.log(`   Erreur: ${result.details.error}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Fonction principale
async function main() {
  const tester = new PerformanceTester();
  const results = await tester.runAllTests();
  
  const failedTests = results.filter(r => !r.success);
  
  if (failedTests.length > 0) {
    console.error(`\n❌ ${failedTests.length} test(s) ont échoué!`);
    process.exit(1);
  } else {
    console.log('\n🎉 Tous les tests de performance ont réussi!');
    process.exit(0);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

export { PerformanceTester };