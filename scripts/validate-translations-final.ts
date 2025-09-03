#!/usr/bin/env tsx

/**
 * Script de validation finale des traductions next-intl
 * Vérifie la cohérence, les performances et la fonctionnalité complète
 */

import fs from 'fs';
import path from 'path';
import { analyzeTranslationBundles, generatePerformanceReport } from '../lib/utils/bundle-analyzer';
import { getCacheStats, preloadAllMessages } from '../lib/i18n-optimizations';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: any;
}

interface TranslationFile {
  locale: string;
  content: any;
  size: number;
  keys: string[];
}

class TranslationValidator {
  private locales = ['fr', 'en', 'ar'];
  private translationFiles: TranslationFile[] = [];
  private results: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    stats: {}
  };

  async validateAll(): Promise<ValidationResult> {
    console.log('🚀 Démarrage de la validation finale des traductions...\n');

    try {
      // 1. Charger tous les fichiers de traduction
      await this.loadTranslationFiles();
      
      // 2. Valider la structure et cohérence
      await this.validateStructure();
      
      // 3. Valider les clés manquantes
      await this.validateMissingKeys();
      
      // 4. Valider les interpolations
      await this.validateInterpolations();
      
      // 5. Valider les performances
      await this.validatePerformance();
      
      // 6. Tester le chargement des traductions
      await this.testTranslationLoading();
      
      // 7. Générer le rapport final
      await this.generateFinalReport();

    } catch (error) {
      this.results.errors.push(`Erreur critique: ${error}`);
      this.results.success = false;
    }

    return this.results;
  }

  private async loadTranslationFiles(): Promise<void> {
    console.log('📁 Chargement des fichiers de traduction...');
    
    for (const locale of this.locales) {
      try {
        const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
        
        if (!fs.existsSync(filePath)) {
          this.results.errors.push(`Fichier de traduction manquant: ${locale}.json`);
          continue;
        }

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const size = fs.statSync(filePath).size;
        const keys = this.extractAllKeys(content);

        this.translationFiles.push({
          locale,
          content,
          size,
          keys
        });

        console.log(`  ✅ ${locale}.json: ${keys.length} clés, ${Math.round(size / 1024)}KB`);
      } catch (error) {
        this.results.errors.push(`Erreur lors du chargement de ${locale}.json: ${error}`);
      }
    }
  }

  private extractAllKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        keys.push(...this.extractAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  private async validateStructure(): Promise<void> {
    console.log('\n🏗️  Validation de la structure...');
    
    if (this.translationFiles.length === 0) {
      this.results.errors.push('Aucun fichier de traduction trouvé');
      return;
    }

    // Vérifier que tous les locales sont présents
    const loadedLocales = this.translationFiles.map(f => f.locale);
    const missingLocales = this.locales.filter(l => !loadedLocales.includes(l));
    
    if (missingLocales.length > 0) {
      this.results.errors.push(`Locales manquants: ${missingLocales.join(', ')}`);
    }

    // Vérifier la structure des namespaces
    const expectedNamespaces = [
      'common', 'nav', 'auth', 'dashboard', 'lofts', 
      'transactions', 'teams', 'tasks', 'reservations', 
      'reports', 'analytics', 'settings', 'forms'
    ];

    for (const file of this.translationFiles) {
      const namespaces = Object.keys(file.content);
      const missingNamespaces = expectedNamespaces.filter(ns => !namespaces.includes(ns));
      
      if (missingNamespaces.length > 0) {
        this.results.warnings.push(
          `${file.locale}: Namespaces manquants: ${missingNamespaces.join(', ')}`
        );
      }
    }

    console.log('  ✅ Structure validée');
  }

  private async validateMissingKeys(): Promise<void> {
    console.log('\n🔍 Validation des clés manquantes...');
    
    if (this.translationFiles.length < 2) return;

    // Utiliser le français comme référence
    const referenceFile = this.translationFiles.find(f => f.locale === 'fr');
    if (!referenceFile) {
      this.results.errors.push('Fichier de référence français non trouvé');
      return;
    }

    const referenceKeys = new Set(referenceFile.keys);
    
    for (const file of this.translationFiles) {
      if (file.locale === 'fr') continue;
      
      const fileKeys = new Set(file.keys);
      const missingKeys = [...referenceKeys].filter(key => !fileKeys.has(key));
      const extraKeys = [...fileKeys].filter(key => !referenceKeys.has(key));
      
      if (missingKeys.length > 0) {
        this.results.warnings.push(
          `${file.locale}: ${missingKeys.length} clés manquantes (ex: ${missingKeys.slice(0, 3).join(', ')})`
        );
      }
      
      if (extraKeys.length > 0) {
        this.results.warnings.push(
          `${file.locale}: ${extraKeys.length} clés supplémentaires (ex: ${extraKeys.slice(0, 3).join(', ')})`
        );
      }
    }

    console.log('  ✅ Clés validées');
  }

  private async validateInterpolations(): Promise<void> {
    console.log('\n🔧 Validation des interpolations...');
    
    const interpolationPattern = /\{[^}]+\}/g;
    
    for (const file of this.translationFiles) {
      const issues: string[] = [];
      
      this.validateInterpolationsInObject(file.content, '', interpolationPattern, issues);
      
      if (issues.length > 0) {
        this.results.warnings.push(
          `${file.locale}: Problèmes d'interpolation: ${issues.slice(0, 3).join(', ')}`
        );
      }
    }

    console.log('  ✅ Interpolations validées');
  }

  private validateInterpolationsInObject(
    obj: any, 
    prefix: string, 
    pattern: RegExp, 
    issues: string[]
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        const matches = value.match(pattern);
        if (matches) {
          // Vérifier les interpolations malformées
          for (const match of matches) {
            if (!match.match(/^\{[a-zA-Z_][a-zA-Z0-9_]*\}$/)) {
              issues.push(`${fullKey}: interpolation malformée "${match}"`);
            }
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        this.validateInterpolationsInObject(value, fullKey, pattern, issues);
      }
    }
  }

  private async validatePerformance(): Promise<void> {
    console.log('\n⚡ Validation des performances...');
    
    try {
      // Analyser la taille des bundles
      const bundleAnalysis = await analyzeTranslationBundles();
      
      this.results.stats.bundleSize = bundleAnalysis.translationSize;
      this.results.stats.languageBreakdown = bundleAnalysis.languageBreakdown;
      
      // Vérifier les seuils de performance
      const maxBundleSize = 200 * 1024; // 200KB
      if (bundleAnalysis.translationSize > maxBundleSize) {
        this.results.warnings.push(
          `Taille des traductions élevée: ${Math.round(bundleAnalysis.translationSize / 1024)}KB > ${Math.round(maxBundleSize / 1024)}KB`
        );
      }
      
      // Vérifier l'équilibre entre les langues
      const sizes = Object.values(bundleAnalysis.languageBreakdown);
      const maxSize = Math.max(...sizes);
      const minSize = Math.min(...sizes);
      const ratio = maxSize / minSize;
      
      if (ratio > 1.5) {
        this.results.warnings.push(
          `Déséquilibre entre les tailles de langues: ratio ${ratio.toFixed(2)}`
        );
      }

      console.log(`  ✅ Taille totale: ${Math.round(bundleAnalysis.translationSize / 1024)}KB`);
      console.log(`  ✅ Ratio taille max/min: ${ratio.toFixed(2)}`);
      
    } catch (error) {
      this.results.warnings.push(`Erreur d'analyse des performances: ${error}`);
    }
  }

  private async testTranslationLoading(): Promise<void> {
    console.log('\n🔄 Test du chargement des traductions...');
    
    try {
      // Tester le préchargement
      const startTime = Date.now();
      await preloadAllMessages();
      const loadTime = Date.now() - startTime;
      
      this.results.stats.loadTime = loadTime;
      
      if (loadTime > 1000) {
        this.results.warnings.push(`Temps de chargement élevé: ${loadTime}ms`);
      }
      
      // Tester les statistiques de cache
      const cacheStats = getCacheStats();
      this.results.stats.cacheStats = cacheStats;
      
      console.log(`  ✅ Temps de chargement: ${loadTime}ms`);
      console.log(`  ✅ Entrées en cache: ${cacheStats.size}`);
      
    } catch (error) {
      this.results.errors.push(`Erreur lors du test de chargement: ${error}`);
    }
  }

  private async generateFinalReport(): Promise<void> {
    console.log('\n📊 Génération du rapport final...');
    
    const report = {
      timestamp: new Date().toISOString(),
      success: this.results.success,
      summary: {
        totalFiles: this.translationFiles.length,
        totalKeys: this.translationFiles.reduce((sum, f) => sum + f.keys.length, 0),
        totalSize: this.translationFiles.reduce((sum, f) => sum + f.size, 0),
        errors: this.results.errors.length,
        warnings: this.results.warnings.length
      },
      files: this.translationFiles.map(f => ({
        locale: f.locale,
        keys: f.keys.length,
        size: f.size
      })),
      errors: this.results.errors,
      warnings: this.results.warnings,
      performance: this.results.stats
    };

    // Sauvegarder le rapport
    const reportPath = path.join(process.cwd(), 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`  ✅ Rapport sauvegardé: ${reportPath}`);
    
    // Afficher le résumé
    this.displaySummary(report);
  }

  private displaySummary(report: any): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ DE LA VALIDATION');
    console.log('='.repeat(60));
    
    console.log(`✅ Statut: ${report.success ? 'SUCCÈS' : 'ÉCHEC'}`);
    console.log(`📁 Fichiers: ${report.summary.totalFiles}`);
    console.log(`🔑 Clés totales: ${report.summary.totalKeys}`);
    console.log(`💾 Taille totale: ${Math.round(report.summary.totalSize / 1024)}KB`);
    console.log(`❌ Erreurs: ${report.summary.errors}`);
    console.log(`⚠️  Avertissements: ${report.summary.warnings}`);
    
    if (report.performance.loadTime) {
      console.log(`⚡ Temps de chargement: ${report.performance.loadTime}ms`);
    }
    
    console.log('\n📊 DÉTAIL PAR LANGUE:');
    for (const file of report.files) {
      console.log(`  ${file.locale}: ${file.keys} clés, ${Math.round(file.size / 1024)}KB`);
    }
    
    if (report.errors.length > 0) {
      console.log('\n❌ ERREURS:');
      report.errors.forEach((error: string, i: number) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️  AVERTISSEMENTS:');
      report.warnings.forEach((warning: string, i: number) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Fonction principale
async function main() {
  const validator = new TranslationValidator();
  const result = await validator.validateAll();
  
  if (!result.success) {
    console.error('\n❌ La validation a échoué!');
    process.exit(1);
  } else {
    console.log('\n🎉 Validation réussie!');
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

export { TranslationValidator };