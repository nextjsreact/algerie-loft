#!/usr/bin/env tsx

/**
 * Script de test pour le dry-run du clonage d'environnement
 * Ce script simule le processus de clonage sans effectuer de modifications réelles
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration des couleurs pour l'affichage
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

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function logStep(step: string) {
  log(`\n📋 ${step}`, colors.blue);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// Interface pour les configurations d'environnement
interface EnvConfig {
  name: string;
  url: string;
  key: string;
  file: string;
}

// Fonction pour charger les configurations d'environnement
function loadEnvironmentConfigs(): { [key: string]: EnvConfig } {
  const configs: { [key: string]: EnvConfig } = {};
  
  const envFiles = [
    { name: 'prod', file: '.env.production' },
    { name: 'test', file: '.env.local' },
    { name: 'dev', file: '.env' }
  ];

  for (const env of envFiles) {
    const envPath = path.join(process.cwd(), env.file);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      
      let url = '';
      let key = '';
      
      for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
          url = line.split('=')[1]?.trim().replace(/["\r\n\t]/g, '') || '';
        }
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
          key = line.split('=')[1]?.trim().replace(/["\r\n\t]/g, '') || '';
        }
      }
      
      if (url && key) {
        configs[env.name] = {
          name: env.name,
          url,
          key,
          file: env.file
        };
      }
    }
  }
  
  return configs;
}

// Fonction pour tester la connexion à un environnement
async function testConnection(config: EnvConfig): Promise<boolean> {
  try {
    const supabase = createClient(config.url, config.key);
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      logError(`Erreur de connexion à ${config.name}: ${error.message}`);
      return false;
    }
    
    logSuccess(`Connexion réussie à ${config.name}`);
    return true;
  } catch (error) {
    logError(`Erreur de connexion à ${config.name}: ${error}`);
    return false;
  }
}

// Fonction pour analyser la structure d'une base de données
async function analyzeDatabase(config: EnvConfig) {
  try {
    const supabase = createClient(config.url, config.key);
    
    logStep(`Analyse de la base de données ${config.name}`);
    
    // Tables principales à analyser
    const tables = [
      'profiles',
      'lofts', 
      'transactions',
      'bills',
      'payments',
      'contracts',
      'tenants',
      'owners'
    ];
    
    const analysis: { [key: string]: number } = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          logWarning(`Table ${table} non accessible: ${error.message}`);
          analysis[table] = -1;
        } else {
          analysis[table] = count || 0;
          logInfo(`${table}: ${count || 0} enregistrements`);
        }
      } catch (err) {
        logWarning(`Erreur lors de l'analyse de ${table}: ${err}`);
        analysis[table] = -1;
      }
    }
    
    return analysis;
  } catch (error) {
    logError(`Erreur lors de l'analyse de ${config.name}: ${error}`);
    return {};
  }
}

// Fonction pour simuler le processus de clonage
async function simulateCloning(sourceConfig: EnvConfig, targetConfig: EnvConfig) {
  logHeader(`SIMULATION DE CLONAGE: ${sourceConfig.name} → ${targetConfig.name}`);
  
  logStep('Phase 1: Vérification des prérequis');
  
  // Test des connexions
  const sourceConnected = await testConnection(sourceConfig);
  const targetConnected = await testConnection(targetConfig);
  
  if (!sourceConnected || !targetConnected) {
    logError('Impossible de procéder au clonage - problème de connexion');
    return false;
  }
  
  logStep('Phase 2: Analyse des bases de données');
  
  // Analyse des structures
  const sourceAnalysis = await analyzeDatabase(sourceConfig);
  const targetAnalysis = await analyzeDatabase(targetConfig);
  
  logStep('Phase 3: Comparaison des structures');
  
  // Comparaison
  const allTables = new Set([
    ...Object.keys(sourceAnalysis),
    ...Object.keys(targetAnalysis)
  ]);
  
  let compatibilityIssues = 0;
  
  for (const table of allTables) {
    const sourceCount = sourceAnalysis[table] ?? -1;
    const targetExists = targetAnalysis[table] !== undefined;
    
    if (sourceCount === -1) {
      logWarning(`Table ${table} non accessible dans la source`);
      compatibilityIssues++;
    } else if (!targetExists) {
      logWarning(`Table ${table} manquante dans la cible`);
      compatibilityIssues++;
    } else {
      logSuccess(`Table ${table} compatible (${sourceCount} → cible)`);
    }
  }
  
  logStep('Phase 4: Estimation du clonage');
  
  const totalRecords = Object.values(sourceAnalysis)
    .filter(count => count > 0)
    .reduce((sum, count) => sum + count, 0);
  
  logInfo(`Total d'enregistrements à cloner: ${totalRecords}`);
  logInfo(`Temps estimé: ${Math.ceil(totalRecords / 100)} secondes`);
  
  if (compatibilityIssues > 0) {
    logWarning(`${compatibilityIssues} problèmes de compatibilité détectés`);
  } else {
    logSuccess('Aucun problème de compatibilité détecté');
  }
  
  logStep('Phase 5: Résumé de la simulation');
  
  console.log('\n📊 RÉSUMÉ DE LA SIMULATION:');
  console.log(`Source: ${sourceConfig.name} (${sourceConfig.file})`);
  console.log(`Cible: ${targetConfig.name} (${targetConfig.file})`);
  console.log(`Enregistrements à traiter: ${totalRecords}`);
  console.log(`Problèmes détectés: ${compatibilityIssues}`);
  
  return compatibilityIssues === 0;
}

// Fonction principale
async function main() {
  try {
    logHeader('TEST DRY-RUN - CLONAGE D\'ENVIRONNEMENT');
    
    logStep('Chargement des configurations d\'environnement');
    
    const configs = loadEnvironmentConfigs();
    const envNames = Object.keys(configs);
    
    if (envNames.length === 0) {
      logError('Aucune configuration d\'environnement trouvée');
      process.exit(1);
    }
    
    logSuccess(`${envNames.length} environnements détectés: ${envNames.join(', ')}`);
    
    // Affichage des configurations
    for (const [name, config] of Object.entries(configs)) {
      logInfo(`${name}: ${config.file} → ${config.url.substring(0, 30)}...`);
    }
    
    // Tests de connexion pour tous les environnements
    logStep('Test de connexion à tous les environnements');
    
    const connectionResults: { [key: string]: boolean } = {};
    
    for (const [name, config] of Object.entries(configs)) {
      connectionResults[name] = await testConnection(config);
    }
    
    // Simulations de clonage possibles
    const availableEnvs = Object.keys(connectionResults).filter(name => connectionResults[name]);
    
    if (availableEnvs.length < 2) {
      logWarning('Pas assez d\'environnements disponibles pour simuler un clonage');
      return;
    }
    
    logStep('Simulations de clonage possibles');
    
    // Simulation prod → test (si disponible)
    if (availableEnvs.includes('prod') && availableEnvs.includes('test')) {
      await simulateCloning(configs.prod, configs.test);
    }
    
    // Simulation prod → dev (si disponible)
    if (availableEnvs.includes('prod') && availableEnvs.includes('dev')) {
      await simulateCloning(configs.prod, configs.dev);
    }
    
    // Simulation test → dev (si disponible)
    if (availableEnvs.includes('test') && availableEnvs.includes('dev')) {
      await simulateCloning(configs.test, configs.dev);
    }
    
    logHeader('TEST DRY-RUN TERMINÉ');
    logSuccess('Toutes les simulations ont été exécutées avec succès');
    
  } catch (error) {
    logError(`Erreur lors du test dry-run: ${error}`);
    process.exit(1);
  }
}

// Exécution du script
main().catch(console.error);