#!/usr/bin/env node

/**
 * Serveur de Diagnostic - Capture les Vraies Erreurs
 * 
 * Ce script démarre Next.js et capture uniquement les erreurs importantes
 * en filtrant tout le bruit de Console Ninja et les logs de debug
 */

import { spawn } from 'child_process';

class DiagnosticServer {
  constructor() {
    this.serverProcess = null;
    this.errors = [];
    this.warnings = [];
    this.apiCalls = [];
    this.compilationIssues = [];
  }

  async start() {
    console.log('🔍 DIAGNOSTIC SERVER - CAPTURE DES ERREURS RÉELLES');
    console.log('=' .repeat(70));
    console.log('📋 Filtrage actif: Console Ninja, logs de debug, bruit');
    console.log('🎯 Focus: Erreurs, warnings, problèmes de compilation');
    console.log('=' .repeat(70));

    // Variables d'environnement pour minimiser le bruit
    const env = {
      ...process.env,
      DISABLE_CONSOLE_NINJA: 'true',
      CONSOLE_NINJA_DISABLE: 'true',
      NODE_OPTIONS: '--no-warnings',
      NEXT_TELEMETRY_DISABLED: '1'
    };

    // Démarrer Next.js
    this.serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      env
    });

    // Analyser stdout
    this.serverProcess.stdout.on('data', (data) => {
      this.analyzeOutput(data.toString(), 'stdout');
    });

    // Analyser stderr
    this.serverProcess.stderr.on('data', (data) => {
      this.analyzeOutput(data.toString(), 'stderr');
    });

    // Gérer les événements du processus
    this.serverProcess.on('close', (code) => {
      this.displaySummary();
      console.log(`\n🛑 Serveur fermé avec le code ${code}`);
    });

    this.serverProcess.on('error', (error) => {
      console.error('❌ Erreur critique du serveur:', error);
    });

    // Arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du diagnostic...');
      this.displaySummary();
      if (this.serverProcess) {
        this.serverProcess.kill('SIGINT');
      }
      process.exit(0);
    });
  }

  analyzeOutput(output, source) {
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Ignorer le bruit de Console Ninja
      if (this.isConsoleNinjaNoise(line)) {
        continue;
      }

      // Capturer les erreurs importantes
      if (this.isError(line)) {
        this.errors.push({
          timestamp: new Date().toISOString(),
          source,
          message: line.trim()
        });
        console.log('❌ ERREUR:', line.trim());
      }
      // Capturer les warnings
      else if (this.isWarning(line)) {
        this.warnings.push({
          timestamp: new Date().toISOString(),
          source,
          message: line.trim()
        });
        console.log('⚠️  WARNING:', line.trim());
      }
      // Capturer les problèmes de compilation
      else if (this.isCompilationIssue(line)) {
        this.compilationIssues.push({
          timestamp: new Date().toISOString(),
          source,
          message: line.trim()
        });
        console.log('🔧 COMPILATION:', line.trim());
      }
      // Capturer les appels API avec erreurs
      else if (this.isApiError(line)) {
        this.apiCalls.push({
          timestamp: new Date().toISOString(),
          source,
          message: line.trim()
        });
        console.log('🌐 API ISSUE:', line.trim());
      }
      // Afficher les messages importants
      else if (this.isImportantMessage(line)) {
        console.log('ℹ️  INFO:', line.trim());
      }
    }
  }

  isConsoleNinjaNoise(line) {
    const noisePatterns = [
      /console_ninja/i,
      /oo_oo\(/,
      /oo_tx\(/,
      /oo_cm\(/,
      /eslint-disable.*console\.log/,
      /globalThis\._console_ninja/,
      /Console Ninja extension/,
      /https:\/\/github\.com\/wallabyjs\/console-ninja/,
      /_0x[a-f0-9]+/,
      /function _0x/,
      /var _0x[a-f0-9]+=/
    ];

    return noisePatterns.some(pattern => pattern.test(line));
  }

  isError(line) {
    const errorPatterns = [
      /error:/i,
      /failed/i,
      /cannot/i,
      /unable to/i,
      /not found/i,
      /invalid/i,
      /unexpected/i,
      /syntax error/i,
      /reference error/i,
      /type error/i,
      /❌/
    ];

    return errorPatterns.some(pattern => pattern.test(line)) && 
           !this.isConsoleNinjaNoise(line);
  }

  isWarning(line) {
    const warningPatterns = [
      /warning:/i,
      /warn:/i,
      /deprecated/i,
      /⚠/,
      /caution/i
    ];

    return warningPatterns.some(pattern => pattern.test(line)) && 
           !this.isConsoleNinjaNoise(line);
  }

  isCompilationIssue(line) {
    const compilationPatterns = [
      /compiling/i,
      /compile:/i,
      /build/i,
      /webpack/i,
      /turbopack/i,
      /○ Compiling/,
      /✓ Compiled/,
      /Failed to compile/i
    ];

    return compilationPatterns.some(pattern => pattern.test(line));
  }

  isApiError(line) {
    const apiPatterns = [
      /GET.*[45]\d\d/,
      /POST.*[45]\d\d/,
      /PUT.*[45]\d\d/,
      /DELETE.*[45]\d\d/,
      /api.*error/i,
      /timeout/i,
      /connection.*failed/i
    ];

    return apiPatterns.some(pattern => pattern.test(line));
  }

  isImportantMessage(line) {
    const importantPatterns = [
      /ready/i,
      /started/i,
      /listening/i,
      /local:/i,
      /network:/i,
      /✓/,
      /next\.js/i
    ];

    return importantPatterns.some(pattern => pattern.test(line)) && 
           !this.isConsoleNinjaNoise(line);
  }

  displaySummary() {
      console.log('\n📊 RÉSUMÉ DU DIAGNOSTIC');
    console.log('=' .repeat(50));
    
    console.log(`❌ Erreurs détectées: ${this.errors.length}`);
    if (this.errors.length > 0) {
      this.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message}`);
      });
    }

    console.log(`⚠️  Warnings détectés: ${this.warnings.length}`);
    if (this.warnings.length > 0) {
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning.message}`);
      });
    }

    console.log(`🔧 Problèmes de compilation: ${this.compilationIssues.length}`);
    
    console.log(`🌐 Problèmes API: ${this.apiCalls.length}`);
    if (this.apiCalls.length > 0) {
      this.apiCalls.forEach((api, i) => {
        console.log(`   ${i + 1}. ${api.message}`);
      });
    }

    console.log('=' .repeat(50));
  }
}

// Démarrer le serveur de diagnostic
const diagnostic = new DiagnosticServer();
diagnostic.start().catch(error => {
  console.error('💥 Erreur critique du diagnostic:', error);
  process.exit(1);
});