#!/usr/bin/env node

/**
 * Serveur de Développement Minimal et Propre
 * 
 * Démarre Next.js sans aucun script de test automatique
 */

import { spawn } from 'child_process';

console.log('🚀 Démarrage du serveur Next.js minimal...');
console.log('📋 Aucun script de test automatique');
console.log('🎯 Focus: Serveur de développement pur');
console.log('=' .repeat(60));

// Variables d'environnement pour un serveur propre
const env = {
  ...process.env,
  DISABLE_CONSOLE_NINJA: 'true',
  NODE_OPTIONS: '--no-warnings',
  NEXT_TELEMETRY_DISABLED: '1',
  // Désactiver tous les scripts de test automatiques
  DISABLE_AUTO_TESTS: 'true',
  NODE_ENV: 'development'
};

// Démarrer Next.js directement
const serverProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env
});

// Gérer les événements
serverProcess.on('close', (code) => {
  console.log(`\n🛑 Serveur fermé avec le code ${code}`);
});

serverProcess.on('error', (error) => {
  console.error('❌ Erreur du serveur:', error);
});

// Arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});