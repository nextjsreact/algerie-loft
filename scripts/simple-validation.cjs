#!/usr/bin/env node

/**
 * Script de validation simple pour vérifier la migration next-intl
 */

const fs = require('fs');
const path = require('path');

class SimpleValidator {
  constructor() {
    this.results = [];
  }

  async validate() {
    console.log('🚀 Validation simple de la migration next-intl...\n');

    // 1. Vérifier les fichiers de traduction
    this.validateTranslationFiles();
    
    // 2. Vérifier la configuration next-intl
    this.validateNextIntlConfig();
    
    // 3. Vérifier les composants optimisés
    this.validateOptimizedComponents();
    
    // 4. Vérifier la structure des routes
    this.validateRouteStructure();
    
    // 5. Afficher les résultats
    this.displayResults();

    return this.results.every(r => r.success);
  }

  validateTranslationFiles() {
    console.log('📁 Validation des fichiers de traduction...');
    
    const locales = ['fr', 'en', 'ar'];
    const requiredNamespaces = ['common', 'nav', 'auth', 'dashboard', 'lofts'];
    
    for (const locale of locales) {
      const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
      
      if (!fs.existsSync(filePath)) {
        this.results.push({
          success: false,
          message: `Fichier de traduction manquant: ${locale}.json`
        });
        continue;
      }

      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const namespaces = Object.keys(content);
        
        const missingNamespaces = requiredNamespaces.filter(ns => !namespaces.includes(ns));
        
        if (missingNamespaces.length > 0) {
          this.results.push({
            success: false,
            message: `${locale}: Namespaces manquants: ${missingNamespaces.join(', ')}`
          });
        } else {
          this.results.push({
            success: true,
            message: `${locale}: Fichier de traduction valide (${namespaces.length} namespaces)`
          });
        }
        
      } catch (error) {
        this.results.push({
          success: false,
          message: `${locale}: Erreur de parsing JSON: ${error.message}`
        });
      }
    }
  }

  validateNextIntlConfig() {
    console.log('\n⚙️  Validation de la configuration next-intl...');
    
    // Vérifier i18n.ts
    const i18nPath = path.join(process.cwd(), 'i18n.ts');
    if (fs.existsSync(i18nPath)) {
      const content = fs.readFileSync(i18nPath, 'utf-8');
      
      if (content.includes('getRequestConfig') && content.includes('next-intl/server')) {
        this.results.push({
          success: true,
          message: 'Configuration i18n.ts valide'
        });
      } else {
        this.results.push({
          success: false,
          message: 'Configuration i18n.ts incomplète'
        });
      }
    } else {
      this.results.push({
        success: false,
        message: 'Fichier i18n.ts manquant'
      });
    }
    
    // Vérifier middleware.ts
    const middlewarePath = path.join(process.cwd(), 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf-8');
      
      if (content.includes('createMiddleware') && content.includes('next-intl/middleware')) {
        this.results.push({
          success: true,
          message: 'Middleware next-intl configuré'
        });
      } else {
        this.results.push({
          success: false,
          message: 'Middleware next-intl non configuré'
        });
      }
    } else {
      this.results.push({
        success: false,
        message: 'Fichier middleware.ts manquant'
      });
    }
    
    // Vérifier next.config.mjs
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf-8');
      
      if (content.includes('createNextIntlPlugin')) {
        this.results.push({
          success: true,
          message: 'Plugin next-intl configuré dans next.config.mjs'
        });
      } else {
        this.results.push({
          success: false,
          message: 'Plugin next-intl non configuré dans next.config.mjs'
        });
      }
    }
  }

  validateOptimizedComponents() {
    console.log('\n🔧 Validation des composants optimisés...');
    
    // Vérifier les optimisations
    const optimizationsPath = path.join(process.cwd(), 'lib', 'i18n-optimizations.ts');
    if (fs.existsSync(optimizationsPath)) {
      const content = fs.readFileSync(optimizationsPath, 'utf-8');
      
      const features = [
        'getMessages',
        'preloadAllMessages',
        'getCacheStats',
        'routeNamespaces',
        'preloadRouteTranslations'
      ];
      
      const missingFeatures = features.filter(feature => !content.includes(feature));
      
      if (missingFeatures.length === 0) {
        this.results.push({
          success: true,
          message: 'Optimisations i18n complètes'
        });
      } else {
        this.results.push({
          success: false,
          message: `Optimisations manquantes: ${missingFeatures.join(', ')}`
        });
      }
    } else {
      this.results.push({
        success: false,
        message: 'Fichier d\'optimisations manquant'
      });
    }
    
    // Vérifier les hooks de cache
    const cacheHookPath = path.join(process.cwd(), 'lib', 'hooks', 'use-cached-translations.ts');
    if (fs.existsSync(cacheHookPath)) {
      const content = fs.readFileSync(cacheHookPath, 'utf-8');
      
      if (content.includes('useCachedTranslations') && content.includes('clearTranslationCache')) {
        this.results.push({
          success: true,
          message: 'Hook de cache des traductions configuré'
        });
      } else {
        this.results.push({
          success: false,
          message: 'Hook de cache incomplet'
        });
      }
    } else {
      this.results.push({
        success: false,
        message: 'Hook de cache manquant'
      });
    }
  }

  validateRouteStructure() {
    console.log('\n🛣️  Validation de la structure des routes...');
    
    // Vérifier la structure app/[locale]
    const localeLayoutPath = path.join(process.cwd(), 'app', '[locale]', 'layout.tsx');
    if (fs.existsSync(localeLayoutPath)) {
      const content = fs.readFileSync(localeLayoutPath, 'utf-8');
      
      if (content.includes('OptimizedIntlProvider') || content.includes('NextIntlClientProvider')) {
        this.results.push({
          success: true,
          message: 'Layout localisé configuré avec provider'
        });
      } else {
        this.results.push({
          success: false,
          message: 'Layout localisé sans provider next-intl'
        });
      }
    } else {
      this.results.push({
        success: false,
        message: 'Layout localisé manquant'
      });
    }
    
    // Vérifier quelques pages importantes
    const importantPages = [
      'app/[locale]/dashboard/page.tsx',
      'app/[locale]/login/page.tsx'
    ];
    
    for (const pagePath of importantPages) {
      const fullPath = path.join(process.cwd(), pagePath);
      if (fs.existsSync(fullPath)) {
        this.results.push({
          success: true,
          message: `Page localisée trouvée: ${pagePath}`
        });
      } else {
        this.results.push({
          success: false,
          message: `Page localisée manquante: ${pagePath}`
        });
      }
    }
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTATS DE LA VALIDATION');
    console.log('='.repeat(60));
    
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = Math.round((successCount / totalCount) * 100);
    
    console.log(`✅ Tests réussis: ${successCount}/${totalCount} (${successRate}%)`);
    
    console.log('\n📋 DÉTAIL DES RÉSULTATS:');
    
    for (const result of this.results) {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (successCount === totalCount) {
      console.log('🎉 VALIDATION RÉUSSIE! La migration next-intl est complète.');
    } else {
      console.log(`⚠️  ${totalCount - successCount} problème(s) détecté(s). Vérifiez les éléments ci-dessus.`);
    }
    
    console.log('='.repeat(60));
  }
}

// Fonction principale
async function main() {
  const validator = new SimpleValidator();
  const success = await validator.validate();
  
  process.exit(success ? 0 : 1);
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('Erreur lors de la validation:', error);
    process.exit(1);
  });
}

module.exports = { SimpleValidator };