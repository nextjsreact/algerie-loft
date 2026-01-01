#!/usr/bin/env node

/**
 * Vérification post-nettoyage
 */

import { execSync } from 'child_process';

console.log('🔍 Vérification post-nettoyage...');

try {
  // Chercher toutes les références restantes
  const result = execSync('grep -r "loft_owners" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.backup" 2>/dev/null || true', { encoding: 'utf-8' });
  
  if (result.trim()) {
    console.log('⚠️  Références restantes trouvées:');
    console.log(result);
  } else {
    console.log('✅ Aucune référence loft_owners trouvée !');
  }
} catch (error) {
  console.log('ℹ️  Vérification terminée (grep non disponible sur Windows)');
}

// Test de l'API
async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/debug/database');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API debug fonctionne');
      console.log(`📊 Owners: ${data.data?.owners?.count || 0}`);
      console.log(`📊 Lofts: ${data.data?.lofts?.count || 0}`);
    } else {
      console.log('❌ Erreur API:', data.error);
    }
  } catch (error) {
    console.log('❌ Serveur non accessible:', error.message);
  }
}

testAPI();
