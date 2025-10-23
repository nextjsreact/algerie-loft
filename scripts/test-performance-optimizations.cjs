const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function testPerformanceOptimizations() {
  log('🚀 Test des Optimisations de Performance - Loft Algérie', 'cyan');
  log('=' .repeat(60), 'blue');
  
  const tests = [
    {
      name: 'Configuration Next.js optimisée',
      file: 'next.config.mjs',
      description: 'Compression, optimisation images, code splitting'
    },
    {
      name: 'Middleware de performance',
      file: 'middleware/performance.ts',
      description: 'Headers de cache, sécurité, resource hints'
    },
    {
      name: 'PerformanceProvider intégré',
      file: 'components/providers/PerformanceProvider.tsx',
      description: 'Context global pour le monitoring'
    },
    {
      name: 'OptimizedImage component',
      file: 'components/ui/OptimizedImage.tsx',
      description: 'Images avec lazy loading et formats modernes'
    },
    {
      name: 'OptimizedLogo component',
      file: 'components/ui/OptimizedLogo.tsx',
      description: 'Logo avec intersection observer'
    },
    {
      name: 'VirtualizedList component',
      file: 'components/ui/VirtualizedList.tsx',
      description: 'Listes virtualisées pour de meilleures performances'
    },
    {
      name: 'Hooks de performance',
      file: 'hooks/usePerformanceOptimization.ts',
      description: 'Debounce, throttle, intersection observer'
    },
    {
      name: 'Requêtes optimisées',
      file: 'hooks/useOptimizedQuery.ts',
      description: 'Cache intelligent pour les requêtes'
    },
    {
      name: 'Cache manager avancé',
      file: 'lib/cache-manager.ts',
      description: 'Cache multi-niveaux avec stratégies'
    },
    {
      name: 'Performance monitor',
      file: 'components/debug/PerformanceMonitor.tsx',
      description: 'Monitoring en temps réel'
    },
    {
      name: 'Optimisation des polices',
      file: 'components/ui/OptimizedFonts.tsx',
      description: 'Chargement optimisé des polices'
    },
    {
      name: 'Scripts d\'analyse',
      file: 'scripts/analyze-bundle.js',
      description: 'Analyse de la taille des bundles'
    },
    {
      name: 'Optimisation d\'images',
      file: 'scripts/optimize-images.js',
      description: 'Optimisation automatique des images'
    },
    {
      name: 'Configuration size-limit',
      file: '.size-limit.json',
      description: 'Monitoring continu de la taille'
    },
    {
      name: 'Page de test',
      file: 'app/performance-test/page.tsx',
      description: 'Tests complets des optimisations'
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  log('\\n📋 Vérification des Composants:', 'magenta');
  log('-' .repeat(40), 'blue');
  
  tests.forEach(test => {
    const exists = checkFileExists(test.file);
    const status = exists ? '✅' : '❌';
    const color = exists ? 'green' : 'red';
    
    log(`${status} ${test.name}`, color);
    log(`   📁 ${test.file}`, 'cyan');
    log(`   📝 ${test.description}`, 'yellow');
    
    if (exists) {
      passedTests++;
    }
    
    log(''); // Empty line
  });
  
  // Check package.json scripts
  log('📦 Vérification des Scripts NPM:', 'magenta');
  log('-' .repeat(40), 'blue');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const expectedScripts = [
      'perf:analyze',
      'perf:optimize-images',
      'perf:audit',
      'perf:lighthouse',
      'perf:bundle-analyzer'
    ];
    
    expectedScripts.forEach(script => {
      const exists = scripts[script];
      const status = exists ? '✅' : '❌';
      const color = exists ? 'green' : 'red';
      
      log(`${status} ${script}`, color);
      if (exists) {
        log(`   🔧 ${scripts[script]}`, 'cyan');
      }
    });
  }
  
  // Summary
  log('\\n📊 Résumé des Tests:', 'bright');
  log('=' .repeat(40), 'blue');
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  const summaryColor = percentage === 100 ? 'green' : percentage >= 80 ? 'yellow' : 'red';
  
  log(`Tests réussis: ${passedTests}/${totalTests} (${percentage}%)`, summaryColor);
  
  if (percentage === 100) {
    log('\\n🎉 Toutes les optimisations sont correctement installées !', 'green');
    log('\\n🚀 Prochaines étapes:', 'cyan');
    log('1. Démarrez le serveur: npm run dev', 'white');
    log('2. Visitez: http://localhost:3000/performance-test', 'white');
    log('3. Consultez le guide: GUIDE_INTEGRATION_PERFORMANCE.md', 'white');
    log('4. Analysez les performances: npm run perf:analyze', 'white');
  } else {
    log('\\n⚠️  Certaines optimisations sont manquantes.', 'yellow');
    log('Consultez les erreurs ci-dessus pour les corriger.', 'yellow');
  }
  
  // Performance tips
  log('\\n💡 Conseils de Performance:', 'magenta');
  log('-' .repeat(40), 'blue');
  
  const tips = [
    'Utilisez OptimizedImage pour toutes vos images',
    'Implémentez le lazy loading avec useIntersectionObserver',
    'Utilisez useDebounce pour les inputs de recherche',
    'Mettez en cache les requêtes coûteuses avec useOptimizedQuery',
    'Surveillez les métriques avec le PerformanceMonitor',
    'Exécutez régulièrement npm run perf:audit',
    'Optimisez vos images avec npm run perf:optimize-images'
  ];
  
  tips.forEach((tip, index) => {
    log(`${index + 1}. ${tip}`, 'white');
  });
  
  log('\\n📚 Documentation:', 'magenta');
  log('- Guide d\'intégration: GUIDE_INTEGRATION_PERFORMANCE.md', 'cyan');
  log('- Optimisations implémentées: PERFORMANCE_OPTIMIZATIONS_IMPLEMENTED.md', 'cyan');
  log('- Page de test: /performance-test', 'cyan');
  
  log('\\n✨ Bonne optimisation !', 'green');
}

// Run the test
if (require.main === module) {
  testPerformanceOptimizations();
}

module.exports = { testPerformanceOptimizations };