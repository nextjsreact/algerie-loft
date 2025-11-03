#!/usr/bin/env tsx

/**
 * Script de déploiement staging pour le système partenaire
 * Prépare et déploie le système partenaire en environnement staging
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

interface DeploymentConfig {
  environment: 'staging';
  branch: string;
  commit: string;
  timestamp: string;
  features: string[];
  tests_passed: boolean;
  database_ready: boolean;
}

class PartnerSystemStagingDeployment {
  private config: DeploymentConfig;
  private deploymentLog: string[] = [];

  constructor() {
    this.config = {
      environment: 'staging',
      branch: this.getCurrentBranch(),
      commit: this.getCurrentCommit(),
      timestamp: new Date().toISOString(),
      features: [
        'partner-registration',
        'partner-dashboard',
        'admin-validation',
        'property-management',
        'revenue-tracking',
        'security-system',
        'monitoring'
      ],
      tests_passed: false,
      database_ready: false
    };
  }

  async deploy(): Promise<void> {
    console.log('🚀 Déploiement staging du système partenaire');
    console.log('===============================================\n');

    try {
      await this.preDeploymentChecks();
      await this.runPartnerSystemTests();
      await this.prepareDatabaseMigrations();
      await this.buildApplication();
      await this.deployToStaging();
      await this.postDeploymentValidation();
      await this.generateDeploymentReport();

      console.log('\n🎉 Déploiement staging réussi !');
      this.showDeploymentSummary();

    } catch (error) {
      console.error('\n❌ Échec du déploiement:', error);
      await this.rollbackIfNeeded();
      process.exit(1);
    }
  }

  private async preDeploymentChecks(): Promise<void> {
    this.log('🔍 Vérifications pré-déploiement...');

    // Vérifier l'état Git
    this.checkGitStatus();

    // Vérifier les variables d'environnement staging
    this.checkStagingEnvironment();

    // Vérifier les dépendances
    this.checkDependencies();

    // Vérifier la structure du système partenaire
    this.checkPartnerSystemStructure();

    this.log('✅ Vérifications pré-déploiement terminées');
  }

  private checkGitStatus(): void {
    this.log('  📋 Vérification de l\'état Git...');
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (status.trim()) {
        console.warn('⚠️  Modifications non commitées détectées:');
        console.log(status);
        
        // Pour le staging, on peut continuer avec des modifications
        console.log('   Continuation autorisée pour l\'environnement staging');
      }

      // Vérifier que nous avons les derniers commits du système partenaire
      const recentCommits = execSync('git log --oneline -10', { encoding: 'utf-8' });
      if (!recentCommits.includes('partner') && !recentCommits.includes('Partner')) {
        console.warn('⚠️  Aucun commit récent lié au système partenaire détecté');
      }

    } catch (error) {
      throw new Error(`Erreur Git: ${error}`);
    }
  }

  private checkStagingEnvironment(): void {
    this.log('  🌍 Vérification de l\'environnement staging...');

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    // Vérifier le fichier .env.staging ou .env.local
    const envFiles = ['.env.staging', '.env.local', '.env'];
    let envFound = false;

    for (const envFile of envFiles) {
      if (existsSync(envFile)) {
        this.log(`    📄 Fichier d'environnement trouvé: ${envFile}`);
        envFound = true;
        
        const envContent = readFileSync(envFile, 'utf-8');
        const missingVars = requiredEnvVars.filter(varName => 
          !envContent.includes(varName)
        );

        if (missingVars.length > 0) {
          console.warn(`⚠️  Variables manquantes dans ${envFile}:`, missingVars);
        }
        break;
      }
    }

    if (!envFound) {
      throw new Error('Aucun fichier d\'environnement trouvé');
    }
  }

  private checkDependencies(): void {
    this.log('  📦 Vérification des dépendances...');

    try {
      // Vérifier package.json
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      const requiredDeps = [
        '@supabase/supabase-js',
        '@supabase/ssr',
        'next',
        'react',
        'zod'
      ];

      const missingDeps = requiredDeps.filter(dep => 
        !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
      );

      if (missingDeps.length > 0) {
        throw new Error(`Dépendances manquantes: ${missingDeps.join(', ')}`);
      }

      // Vérifier node_modules
      if (!existsSync('node_modules')) {
        this.log('    📥 Installation des dépendances...');
        execSync('npm ci', { stdio: 'inherit' });
      }

    } catch (error) {
      throw new Error(`Erreur dépendances: ${error}`);
    }
  }

  private checkPartnerSystemStructure(): void {
    this.log('  🏗️  Vérification de la structure du système partenaire...');

    const requiredFiles = [
      // API Routes
      'app/api/partner/register/route.ts',
      'app/api/partner/dashboard/route.ts',
      'app/api/partner/health/route.ts',
      'app/api/admin/partners/validation-requests/route.ts',
      'app/api/integration/partner-system/route.ts',
      'app/api/monitoring/partner-system/route.ts',
      
      // Types
      'types/partner.ts',
      
      // Database
      'database/partners-schema.sql',
      'database/partner-validation-requests-schema.sql',
      
      // Integration
      'lib/integration/partner-system-integration.ts',
      'lib/integration/booking-system-integration.ts',
      
      // Monitoring
      'lib/monitoring/partner-system-monitor.ts',
      
      // Tests
      'tests/integration/partner-system-core.test.ts',
      'tests/security/partner-security.test.ts',
      'tests/performance/partner-performance.test.ts'
    ];

    const missingFiles = requiredFiles.filter(file => !existsSync(file));
    
    if (missingFiles.length > 0) {
      console.error('❌ Fichiers manquants du système partenaire:');
      missingFiles.forEach(file => console.error(`   - ${file}`));
      throw new Error('Structure du système partenaire incomplète');
    }

    this.log('    ✅ Structure du système partenaire vérifiée');
  }

  private async runPartnerSystemTests(): Promise<void> {
    this.log('🧪 Exécution des tests du système partenaire...');

    try {
      // Exécuter les tests avec notre runner personnalisé
      execSync('npx tsx scripts/run-partner-tests.ts', { 
        stdio: 'inherit',
        timeout: 60000 // 1 minute timeout
      });

      this.config.tests_passed = true;
      this.log('✅ Tous les tests du système partenaire sont passés');

    } catch (error) {
      console.error('❌ Échec des tests du système partenaire');
      
      // Pour le staging, on peut continuer avec des tests échoués (avec avertissement)
      console.warn('⚠️  Continuation du déploiement staging malgré l\'échec des tests');
      console.warn('   Assurez-vous de corriger les problèmes avant la production');
      
      this.config.tests_passed = false;
    }
  }

  private async prepareDatabaseMigrations(): Promise<void> {
    this.log('🗄️  Préparation des migrations de base de données...');

    try {
      // Vérifier les scripts de migration
      const migrationFiles = [
        'database/partners-schema.sql',
        'database/partner-validation-requests-schema.sql',
        'database/partner-rls-policies.sql',
        'database/partner-audit-triggers.sql'
      ];

      const existingMigrations = migrationFiles.filter(file => existsSync(file));
      
      if (existingMigrations.length === 0) {
        console.warn('⚠️  Aucun script de migration trouvé');
        console.warn('   Les tables partenaires doivent être créées manuellement');
      } else {
        this.log(`    📄 ${existingMigrations.length} scripts de migration trouvés`);
        
        // Créer un script de migration combiné pour le staging
        const combinedMigration = existingMigrations
          .map(file => readFileSync(file, 'utf-8'))
          .join('\n\n-- ========================================\n\n');

        writeFileSync('database/staging-partner-migration.sql', combinedMigration);
        this.log('    📝 Script de migration staging créé');
      }

      this.config.database_ready = true;

    } catch (error) {
      console.error('❌ Erreur préparation base de données:', error);
      this.config.database_ready = false;
    }
  }

  private async buildApplication(): Promise<void> {
    this.log('🔨 Build de l\'application...');

    try {
      // Définir les variables d'environnement pour le build
      process.env.NODE_ENV = 'production';
      process.env.NEXT_TELEMETRY_DISABLED = '1';

      // Build Next.js
      execSync('npm run build', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes timeout
      });

      this.log('✅ Build réussi');

    } catch (error) {
      throw new Error(`Échec du build: ${error}`);
    }
  }

  private async deployToStaging(): Promise<void> {
    this.log('🚀 Déploiement vers staging...');

    try {
      // Utiliser le script de déploiement PowerShell existant
      execSync('npm run deploy:staging', { 
        stdio: 'inherit',
        timeout: 600000 // 10 minutes timeout
      });

      this.log('✅ Déploiement staging réussi');

    } catch (error) {
      throw new Error(`Échec du déploiement staging: ${error}`);
    }
  }

  private async postDeploymentValidation(): Promise<void> {
    this.log('✅ Validation post-déploiement...');

    // Attendre que le déploiement soit prêt
    await this.sleep(15000); // 15 secondes

    try {
      // Vérifier l'URL de déploiement
      const deploymentUrl = this.getDeploymentUrl();
      
      if (deploymentUrl) {
        this.log(`    🌐 URL de déploiement: ${deploymentUrl}`);
        
        // Tester les endpoints critiques du système partenaire
        await this.testPartnerSystemEndpoints(deploymentUrl);
      } else {
        console.warn('⚠️  URL de déploiement non trouvée');
      }

    } catch (error) {
      console.warn('⚠️  Validation post-déploiement échouée:', error);
      console.warn('   Vérifiez manuellement le déploiement');
    }
  }

  private async testPartnerSystemEndpoints(baseUrl: string): Promise<void> {
    this.log('    🔍 Test des endpoints du système partenaire...');

    const endpoints = [
      '/api/partner/health',
      '/api/monitoring/partner-system?action=health',
      '/api/integration/partner-system?action=check-compatibility'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'User-Agent': 'Partner-System-Deployment-Test' }
        });

        if (response.ok) {
          this.log(`      ✅ ${endpoint} - OK`);
        } else {
          console.warn(`      ⚠️  ${endpoint} - ${response.status}`);
        }
      } catch (error) {
        console.warn(`      ❌ ${endpoint} - Erreur: ${error}`);
      }
    }
  }

  private async generateDeploymentReport(): Promise<void> {
    this.log('📊 Génération du rapport de déploiement...');

    const report = {
      deployment: this.config,
      summary: {
        success: true,
        duration: Date.now() - new Date(this.config.timestamp).getTime(),
        features_deployed: this.config.features.length,
        tests_status: this.config.tests_passed ? 'PASSED' : 'FAILED',
        database_status: this.config.database_ready ? 'READY' : 'NEEDS_MANUAL_SETUP'
      },
      next_steps: [
        'Tester l\'inscription partenaire',
        'Vérifier le dashboard partenaire',
        'Tester l\'interface admin de validation',
        'Valider les notifications email',
        'Vérifier les métriques de monitoring'
      ],
      logs: this.deploymentLog
    };

    const reportPath = `deployment/staging-partner-deployment-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 Rapport sauvegardé: ${reportPath}`);
  }

  private async rollbackIfNeeded(): Promise<void> {
    console.log('🔄 Vérification de la nécessité d\'un rollback...');
    
    // Pour le staging, on ne fait généralement pas de rollback automatique
    console.log('   Rollback automatique désactivé pour l\'environnement staging');
    console.log('   Utilisez `vercel rollback` manuellement si nécessaire');
  }

  private showDeploymentSummary(): void {
    console.log('\n📋 Résumé du déploiement staging');
    console.log('================================');
    console.log(`🌍 Environnement: ${this.config.environment}`);
    console.log(`🌿 Branche: ${this.config.branch}`);
    console.log(`📝 Commit: ${this.config.commit}`);
    console.log(`⏰ Timestamp: ${this.config.timestamp}`);
    console.log(`🧪 Tests: ${this.config.tests_passed ? '✅ PASSÉS' : '❌ ÉCHOUÉS'}`);
    console.log(`🗄️  Base de données: ${this.config.database_ready ? '✅ PRÊTE' : '⚠️  SETUP MANUEL REQUIS'}`);
    console.log(`🎯 Fonctionnalités: ${this.config.features.length} déployées`);
    
    console.log('\n🎯 Fonctionnalités déployées:');
    this.config.features.forEach(feature => {
      console.log(`   ✅ ${feature}`);
    });

    console.log('\n📋 Prochaines étapes:');
    console.log('1. 🧪 Tester l\'inscription partenaire end-to-end');
    console.log('2. 🏠 Valider le dashboard partenaire');
    console.log('3. 👨‍💼 Tester l\'interface admin de validation');
    console.log('4. 📧 Vérifier les notifications email');
    console.log('5. 📊 Contrôler les métriques de monitoring');
    
    const deploymentUrl = this.getDeploymentUrl();
    if (deploymentUrl) {
      console.log(`\n🌐 URL staging: ${deploymentUrl}`);
    }
  }

  // Méthodes utilitaires
  private getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getCurrentCommit(): string {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getDeploymentUrl(): string | null {
    const urlFiles = ['.deployment-url-staging', '.vercel/project.json'];
    
    for (const file of urlFiles) {
      if (existsSync(file)) {
        try {
          const content = readFileSync(file, 'utf-8');
          const urlMatch = content.match(/https:\/\/[^\s"]+\.vercel\.app/);
          if (urlMatch) {
            return urlMatch[0];
          }
        } catch {
          continue;
        }
      }
    }
    
    return null;
  }

  private log(message: string): void {
    console.log(message);
    this.deploymentLog.push(`${new Date().toISOString()}: ${message}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exécution du script
const deployment = new PartnerSystemStagingDeployment();
deployment.deploy().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});