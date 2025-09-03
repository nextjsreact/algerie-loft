#!/usr/bin/env tsx

/**
 * Script de diagnostic pour les configurations d'environnement
 */

import * as fs from 'fs';
import * as path from 'path';

function debugEnvFile(filename: string) {
  console.log(`\n=== DIAGNOSTIC: ${filename} ===`);
  
  const envPath = path.join(process.cwd(), filename);
  
  if (!fs.existsSync(envPath)) {
    console.log(`❌ Fichier non trouvé: ${envPath}`);
    return;
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`📁 Chemin: ${envPath}`);
  console.log(`📏 Taille: ${content.length} caractères`);
  console.log(`📄 Lignes: ${lines.length}`);
  
  let url = '';
  let key = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1]?.trim() || '';
      console.log(`\n🔗 URL trouvée à la ligne ${i + 1}:`);
      console.log(`   Brute: "${line}"`);
      console.log(`   Extraite: "${url}"`);
      console.log(`   Longueur: ${url.length}`);
      console.log(`   Codes ASCII des derniers caractères:`, 
        url.slice(-5).split('').map(c => c.charCodeAt(0)));
      
      // Nettoyage de l'URL
      const cleanUrl = url.replace(/["\r\n\t]/g, '');
      console.log(`   Nettoyée: "${cleanUrl}"`);
      
      // Test de validité
      try {
        new URL(cleanUrl);
        console.log(`   ✅ URL valide`);
      } catch (error) {
        console.log(`   ❌ URL invalide: ${error}`);
      }
    }
    
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      key = line.split('=')[1]?.trim() || '';
      console.log(`\n🔑 Clé trouvée à la ligne ${i + 1}:`);
      console.log(`   Longueur: ${key.length}`);
      const cleanKey = key.replace(/["\r\n\t]/g, '');
      console.log(`   Nettoyée: ${cleanKey.length} caractères`);
    }
  }
  
  return { url: url.replace(/["\r\n\t]/g, ''), key: key.replace(/["\r\n\t]/g, '') };
}

async function testConnection(url: string, key: string, envName: string) {
  console.log(`\n🔌 Test de connexion ${envName}:`);
  console.log(`   URL: ${url}`);
  console.log(`   Clé: ${key.substring(0, 20)}...`);
  
  try {
    // Import dynamique pour éviter les erreurs de module
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);
    
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Connexion réussie`);
    return true;
  } catch (error) {
    console.log(`   ❌ Exception: ${error}`);
    return false;
  }
}

async function main() {
  console.log('🔍 DIAGNOSTIC DES CONFIGURATIONS D\'ENVIRONNEMENT\n');
  
  const envFiles = [
    '.env.production',
    '.env.local', 
    '.env'
  ];
  
  const configs: { [key: string]: { url: string, key: string } } = {};
  
  for (const file of envFiles) {
    const result = debugEnvFile(file);
    if (result && result.url && result.key) {
      const envName = file.replace('.env', '').replace('.production', 'prod').replace('.local', 'test') || 'dev';
      configs[envName] = result;
    }
  }
  
  console.log('\n🧪 TESTS DE CONNEXION:');
  
  for (const [name, config] of Object.entries(configs)) {
    await testConnection(config.url, config.key, name);
  }
}

main().catch(console.error);