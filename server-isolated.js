#!/usr/bin/env node

/**
 * Serveur Next.js Complètement Isolé
 * 
 * Démarre Next.js sans AUCUN script externe
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔒 SERVEUR NEXT.JS ISOLÉ');
console.log('📋 Aucun script externe autorisé');
console.log('🎯 Mode: Développement pur');
console.log('=' .repeat(50));

// Variables d'environnement strictes
const env = {
  // Garder seulement les variables essentielles
  PATH: process.env.PATH,
  USERPROFILE: process.env.USERPROFILE,
  APPDATA: process.env.APPDATA,
  LOCALAPPDATA: process.env.LOCALAPPDATA,
  TEMP: process.env.TEMP,
  TMP: process.env.TMP,
  
  // Variables Next.js essentielles
  NODE_ENV: 'development',
  NEXT_TELEMETRY_DISABLED: '1',
  
  // Variables de l'application (depuis .env.local)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Désactiver tous les scripts de test
  DISABLE_AUTO_TESTS: 'true',
  DISABLE_CONSOLE_NINJA: 'true',
  NODE_OPTIONS: '--no-warnings --max-old-space-size=4096'
};

console.log('🚀 Démarrage de Next.js...');

// Démarrer Next.js avec npx pour éviter les scripts npm
const serverProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env,
  cwd: __dirname
});

// Filtrer la sortie pour enlever le bruit
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Filtrer Console Ninja et autres bruits
  if (!output.includes('console_ninja') && 
      !output.includes('oo_oo') && 
      !output.includes('eslint-disable')) {
    process.stdout.write(output);
  }
});

serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  
  // Afficher seulement les vraies erreurs
  if (output.includes('Error') || 
      output.includes('Failed') || 
      output.includes('Cannot') ||
      output.includes('Warning')) {
    process.stderr.write(output);
  }
});

serverProcess.on('close', (code) => {
  console.log(`\n🛑 Serveur fermé (code: ${code})`);
});

serverProcess.on('error', (error) => {
  console.error('❌ Erreur serveur:', error);
});

// Arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur isolé...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});