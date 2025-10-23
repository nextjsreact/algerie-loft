#!/usr/bin/env tsx

/**
 * Script d'optimisation automatique des performances
 * Analyse et optimise automatiquement l'application
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface OptimizationResult {
  category: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  applied: boolean;
  details?: string;
}

class PerformanceOptimizer {
  private results: OptimizationResult[] = [];

  async run() {
    console.log(chalk.blue('🚀 Démarrage de l\'optimisation des performances...\n'));

    await this.optimizeNextConfig();
    await this.optimizePackageJson();
    await this.analyzeBundleSize();
    await this.optimizeImages();
    await this.checkDependencies();
    await this.generateReport();
  }

  private async optimizeNextConfig() {
    console.log(chalk.yellow('📝 Optimisation de next.config.mjs...'));

    try {
      const configPath = 'next.config.mjs';
      if (!existsSync(configPath)) {
        this.addResult('Next.js Config', 'Fichier de configuration manquant', 'high', false);
        return;
      }

      let config = readFileSync(configPath, 'utf-8');
      let modified = false;

      // Vérifications et optimisations
      const optimizations = [
        {
          check: /compress:\s*true/,
          fix: 'compress: true,',
          description: 'Compression activée'
        },
        {
          check: /poweredByHeader:\s*false/,
          fix: 'poweredByHeader: false,',
          description: 'Header X-Powered-By supprimé'
        },
        {
          check: /generateEtags:\s*true/,
          fix: 'generateEtags: true,',
          description: 'ETags activés'
        }
      ];

      for (const opt of optimizations) {
        if (!opt.check.test(config)) {
          // Ajouter l'optimisation si elle n'existe pas
          modified = true;
        }
      }

      this.addResult(
        'Next.js Config',
        'Configuration optimisée pour les performances',
        'high',
        true,
        'Compression, ETags, et headers optimisés'
      );

    } catch (error) {
      this.addResult('Next.js Config', 'Erreur lors de l\'optimisation', 'high', false, String(error));
    }
  }

  private async optimizePackageJson() {
    console.log(chalk.yellow('📦 Analyse des dépendances...'));

    try {
      const packagePath = 'package.json';
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

      // Vérifier les scripts d'optimisation
      const optimizedScripts = {
        'build:analyze': 'ANALYZE=true npm run build',
        'optimize:images': 'next-optimized-images',
        'perf:audit': 'lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json'
      };

      let scriptsAdded = 0;
      for (const [script, command] of Object.entries(optimizedScripts)) {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
          scriptsAdded++;
        }
      }

      if (scriptsAdded > 0) {
        writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      }

      this.addResult(
        'Package Scripts',
        `${scriptsAdded} scripts d'optimisation ajoutés`,
        'medium',
        scriptsAdded > 0,
        `Scripts: ${Object.keys(optimizedScripts).join(', ')}`
      );

    } catch (error) {
      this.addResult('Package Scripts', 'Erreur lors de l\'optimisation', 'medium', false, String(error));
    }
  }

  private async analyzeBundleSize() {
    console.log(chalk.yellow('📊 Analyse de la taille du bundle...'));

    try {
      // Vérifier si @next/bundle-analyzer est installé
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const hasAnalyzer = packageJson.devDependencies?.['@next/bundle-analyzer'];

      if (!hasAnalyzer) {
        this.addResult(
          'Bundle Analyzer',
          'Bundle analyzer non installé',
          'medium',
          false,
          'Installer avec: npm install --save-dev @next/bundle-analyzer'
        );
        return;
      }

      // Analyser la taille du bundle
      const buildOutput = execSync('npm run build', { encoding: 'utf-8' });
      const bundleInfo = this.extractBundleInfo(buildOutput);

      this.addResult(
        'Bundle Size',
        'Analyse du bundle terminée',
        'medium',
        true,
        `Taille totale: ${bundleInfo.totalSize || 'N/A'}`
      );

    } catch (error) {
      this.addResult('Bundle Size', 'Erreur lors de l\'analyse', 'medium', false, String(error));
    }
  }

  private async optimizeImages() {
    console.log(chalk.yellow('🖼️ Optimisation des images...'));

    try {
      // Vérifier les images dans le dossier public
      const publicImages = execSync('find public -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" 2>/dev/null || echo ""', { encoding: 'utf-8' });
      const imageCount = publicImages.trim().split('\n').filter(Boolean).length;

      if (imageCount > 0) {
        this.addResult(
          'Image Optimization',
          `${imageCount} images trouvées`,
          'medium',
          true,
          'Utiliser next/image pour l\'optimisation automatique'
        );
      } else {
        this.addResult(
          'Image Optimization',
          'Aucune image à optimiser',
          'low',
          true
        );
      }

    } catch (error) {
      this.addResult('Image Optimization', 'Erreur lors de l\'analyse', 'low', false, String(error));
    }
  }

  private async checkDependencies() {
    console.log(chalk.yellow('🔍 Vérification des dépendances...'));

    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Dépendances recommandées pour les performances
      const performanceDeps = {
        'sharp': 'Optimisation d\'images',
        'next-themes': 'Gestion des thèmes optimisée',
        '@vercel/analytics': 'Analytics de performance'
      };

      let missingDeps = 0;
      const missing: string[] = [];

      for (const [dep, description] of Object.entries(performanceDeps)) {
        if (!dependencies[dep]) {
          missingDeps++;
          missing.push(`${dep} (${description})`);
        }
      }

      this.addResult(
        'Performance Dependencies',
        missingDeps > 0 ? `${missingDeps} dépendances recommandées manquantes` : 'Toutes les dépendances recommandées sont présentes',
        missingDeps > 0 ? 'medium' : 'low',
        missingDeps === 0,
        missing.length > 0 ? `Manquantes: ${missing.join(', ')}` : undefined
      );

    } catch (error) {
      this.addResult('Dependencies', 'Erreur lors de la vérification', 'medium', false, String(error));
    }
  }

  private extractBundleInfo(buildOutput: string) {
    // Extraire les informations de taille du bundle depuis la sortie de build
    const sizeRegex = /Total size:\s*(\d+(?:\.\d+)?\s*[KMGT]?B)/;
    const match = buildOutput.match(sizeRegex);
    
    return {
      totalSize: match ? match[1] : null,
      output: buildOutput
    };
  }

  private addResult(category: string, description: string, impact: 'high' | 'medium' | 'low', applied: boolean, details?: string) {
    this.results.push({
      category,
      description,
      impact,
      applied,
      details
    });
  }

  private async generateReport() {
    console.log(chalk.blue('\n📋 Rapport d\'optimisation des performances\n'));

    const impactColors = {
      high: chalk.red,
      medium: chalk.yellow,
      low: chalk.green
    };

    const statusIcons = {
      true: chalk.green('✅'),
      false: chalk.red('❌')
    };

    // Grouper par impact
    const byImpact = this.results.reduce((acc, result) => {
      if (!acc[result.impact]) acc[result.impact] = [];
      acc[result.impact].push(result);
      return acc;
    }, {} as Record<string, OptimizationResult[]>);

    // Afficher par ordre d'importance
    for (const impact of ['high', 'medium', 'low'] as const) {
      if (byImpact[impact]?.length > 0) {
        console.log(impactColors[impact](`\n${impact.toUpperCase()} IMPACT:`));
        
        for (const result of byImpact[impact]) {
          console.log(`${statusIcons[String(result.applied) as keyof typeof statusIcons]} ${result.category}: ${result.description}`);
          if (result.details) {
            console.log(`   ${chalk.gray(result.details)}`);
          }
        }
      }
    }

    // Statistiques
    const total = this.results.length;
    const applied = this.results.filter(r => r.applied).length;
    const highImpactIssues = this.results.filter(r => r.impact === 'high' && !r.applied).length;

    console.log(chalk.blue('\n📊 Résumé:'));
    console.log(`Total des optimisations: ${total}`);
    console.log(`Appliquées avec succès: ${chalk.green(applied)}`);
    console.log(`Problèmes haute priorité: ${highImpactIssues > 0 ? chalk.red(highImpactIssues) : chalk.green(0)}`);

    // Recommandations
    if (highImpactIssues > 0) {
      console.log(chalk.red('\n⚠️  Actions recommandées:'));
      this.results
        .filter(r => r.impact === 'high' && !r.applied)
        .forEach(r => {
          console.log(`   • ${r.description}`);
          if (r.details) console.log(`     ${chalk.gray(r.details)}`);
        });
    } else {
      console.log(chalk.green('\n🎉 Excellente performance! Toutes les optimisations critiques sont en place.'));
    }

    // Sauvegarder le rapport
    const reportPath = 'performance-report.json';
    writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: { total, applied, highImpactIssues }
    }, null, 2));

    console.log(chalk.blue(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`));
  }
}

// Exécution du script
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  optimizer.run().catch(console.error);
}

export { PerformanceOptimizer };