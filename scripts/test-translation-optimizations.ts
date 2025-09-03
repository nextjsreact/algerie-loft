#!/usr/bin/env tsx

/**
 * Script pour tester les optimisations de traduction next-intl
 */

import { 
  getMessages, 
  preloadAllMessages, 
  getCacheStats,
  preloadRouteTranslations,
  getNamespacesForRoute,
  cleanupCache
} from '../lib/i18n-optimizations';
import { analyzeTranslationBundles, generatePerformanceReport } from '../lib/utils/bundle-analyzer';

async function testOptimizations() {
  console.log('🚀 Testing next-intl optimizations...\n');

  // Test 1: Lazy loading par namespace
  console.log('📦 Test 1: Lazy loading by namespace');
  const startTime = Date.now();
  
  try {
    const dashboardNamespaces = getNamespacesForRoute('/dashboard');
    console.log(`Dashboard namespaces: ${dashboardNamespaces.join(', ')}`);
    
    const messages = await getMessages('fr', dashboardNamespaces);
    console.log(`✅ Loaded ${Object.keys(messages).length} namespaces in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('❌ Lazy loading test failed:', error);
  }

  // Test 2: Cache performance
  console.log('\n💾 Test 2: Cache performance');
  
  try {
    // Premier chargement (cache miss)
    const start1 = Date.now();
    await getMessages('fr', ['common', 'nav']);
    const time1 = Date.now() - start1;
    
    // Deuxième chargement (cache hit)
    const start2 = Date.now();
    await getMessages('fr', ['common', 'nav']);
    const time2 = Date.now() - start2;
    
    console.log(`First load (cache miss): ${time1}ms`);
    console.log(`Second load (cache hit): ${time2}ms`);
    console.log(`Cache speedup: ${Math.round((time1 / time2) * 100) / 100}x`);
    
    const cacheStats = getCacheStats();
    console.log(`Cache entries: ${cacheStats.size}`);
  } catch (error) {
    console.error('❌ Cache test failed:', error);
  }

  // Test 3: Préchargement des routes
  console.log('\n🔄 Test 3: Route preloading');
  
  try {
    const routes = ['/dashboard', '/lofts', '/transactions', '/reports'];
    const preloadStart = Date.now();
    
    await Promise.all(
      routes.map(route => preloadRouteTranslations(route, 'fr'))
    );
    
    console.log(`✅ Preloaded ${routes.length} routes in ${Date.now() - preloadStart}ms`);
  } catch (error) {
    console.error('❌ Route preloading test failed:', error);
  }

  // Test 4: Analyse des bundles
  console.log('\n📊 Test 4: Bundle analysis');
  
  try {
    const analysis = await analyzeTranslationBundles();
    console.log(`Total translation size: ${Math.round(analysis.translationSize / 1024)}KB`);
    console.log(`Languages: ${Object.keys(analysis.languageBreakdown).length}`);
    console.log(`Namespaces: ${Object.keys(analysis.namespaceBreakdown).length}`);
    
    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  } catch (error) {
    console.error('❌ Bundle analysis test failed:', error);
  }

  // Test 5: Nettoyage du cache
  console.log('\n🧹 Test 5: Cache cleanup');
  
  try {
    const statsBefore = getCacheStats();
    console.log(`Cache size before cleanup: ${statsBefore.size}`);
    
    cleanupCache(5); // Garder seulement 5 entrées
    
    const statsAfter = getCacheStats();
    console.log(`Cache size after cleanup: ${statsAfter.size}`);
  } catch (error) {
    console.error('❌ Cache cleanup test failed:', error);
  }

  // Test 6: Génération du rapport de performance
  console.log('\n📋 Test 6: Performance report generation');
  
  try {
    const report = await generatePerformanceReport();
    console.log('✅ Performance report generated');
    console.log('\n' + '='.repeat(50));
    console.log(report);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Report generation test failed:', error);
  }

  console.log('\n🎉 All optimization tests completed!');
}

// Test de performance comparative
async function performanceComparison() {
  console.log('\n⚡ Performance Comparison: Full vs Lazy Loading\n');

  // Test chargement complet
  const fullLoadStart = Date.now();
  try {
    await getMessages('fr'); // Chargement complet
    const fullLoadTime = Date.now() - fullLoadStart;
    console.log(`Full loading: ${fullLoadTime}ms`);
  } catch (error) {
    console.error('Full loading failed:', error);
  }

  // Test chargement lazy
  const lazyLoadStart = Date.now();
  try {
    await getMessages('fr', ['common', 'nav']); // Chargement lazy
    const lazyLoadTime = Date.now() - lazyLoadStart;
    console.log(`Lazy loading: ${lazyLoadTime}ms`);
  } catch (error) {
    console.error('Lazy loading failed:', error);
  }
}

// Exécuter les tests
async function main() {
  try {
    await testOptimizations();
    await performanceComparison();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { testOptimizations, performanceComparison };