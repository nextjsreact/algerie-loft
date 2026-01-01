#!/usr/bin/env node

/**
 * Test rapide après nettoyage owners
 */

console.log('🧪 Test rapide après nettoyage...');

async function testReportsAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/debug/database');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API debug fonctionne');
      console.log(`📊 Owners trouvés: ${data.data?.owners?.count || 0}`);
      console.log(`📊 Lofts trouvés: ${data.data?.lofts?.count || 0}`);
    } else {
      console.log('❌ Erreur API:', data.error);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
    console.log('💡 Assurez-vous que le serveur tourne: npm run dev');
  }
}

testReportsAPI();
