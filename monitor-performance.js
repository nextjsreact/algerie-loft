#!/usr/bin/env node

/**
 * Moniteur de performance en temps réel
 * Surveille les APIs et détecte les problèmes
 */

console.log('📊 Moniteur de performance - Loft Algérie\n');

async function testAPIs() {
  const apis = [
    { name: 'Session API', url: '/api/auth/session', maxTime: 1000 },
    { name: 'Notifications API', url: '/api/notifications/unread-count', maxTime: 500 },
    { name: 'Debug Database API', url: '/api/debug/database', maxTime: 2000 },
    { name: 'Analytics Events API', url: '/api/analytics/events', maxTime: 100 }
  ];

  console.log('🧪 Test des APIs critiques...\n');

  for (const api of apis) {
    const start = Date.now();
    
    try {
      const response = await fetch(`http://localhost:3000${api.url}`, {
        method: api.url.includes('events') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: api.url.includes('events') ? JSON.stringify({
          event: 'test',
          data: { test: true }
        }) : undefined
      });
      
      const duration = Date.now() - start;
      const status = response.status;
      
      let statusIcon = '✅';
      let performanceIcon = '🟢';
      
      if (status >= 400) {
        statusIcon = '❌';
      } else if (status >= 300) {
        statusIcon = '⚠️';
      }
      
      if (duration > api.maxTime) {
        performanceIcon = '🔴';
      } else if (duration > api.maxTime * 0.7) {
        performanceIcon = '🟡';
      }
      
      console.log(`${statusIcon} ${performanceIcon} ${api.name}: ${duration}ms (${status}) - ${duration > api.maxTime ? 'LENT' : 'OK'}`);
      
      if (duration > api.maxTime) {
        console.log(`   ⚠️  Dépasse la limite de ${api.maxTime}ms`);
      }
      
    } catch (error) {
      console.log(`❌ 🔴 ${api.name}: ERREUR - ${error.message}`);
    }
  }
}

async function checkServerHealth() {
  console.log('\n🏥 Vérification de la santé du serveur...\n');
  
  try {
    const start = Date.now();
    const response = await fetch('http://localhost:3000/api/health');
    const duration = Date.now() - start;
    
    if (response.ok) {
      console.log(`✅ Serveur en ligne: ${duration}ms`);
    } else {
      console.log(`⚠️  Serveur répond mais avec erreur: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Serveur inaccessible: ${error.message}`);
    console.log('   💡 Assurez-vous que "npm run dev" est lancé');
    return false;
  }
  
  return true;
}

async function monitorContinuous() {
  console.log('\n🔄 Surveillance continue (Ctrl+C pour arrêter)...\n');
  
  let testCount = 0;
  const results = {
    session: [],
    notifications: [],
    database: []
  };
  
  const interval = setInterval(async () => {
    testCount++;
    console.log(`\n--- Test #${testCount} (${new Date().toLocaleTimeString()}) ---`);
    
    // Test session API
    try {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/api/auth/session');
      const duration = Date.now() - start;
      
      results.session.push(duration);
      if (results.session.length > 10) results.session.shift();
      
      const avg = results.session.reduce((a, b) => a + b, 0) / results.session.length;
      const icon = duration > 1000 ? '🔴' : duration > 500 ? '🟡' : '🟢';
      
      console.log(`${icon} Session: ${duration}ms (avg: ${Math.round(avg)}ms)`);
      
    } catch (error) {
      console.log(`❌ Session: ${error.message}`);
    }
    
    // Test notifications API
    try {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/api/notifications/unread-count');
      const duration = Date.now() - start;
      
      results.notifications.push(duration);
      if (results.notifications.length > 10) results.notifications.shift();
      
      const avg = results.notifications.reduce((a, b) => a + b, 0) / results.notifications.length;
      const icon = duration > 500 ? '🔴' : duration > 200 ? '🟡' : '🟢';
      
      console.log(`${icon} Notifications: ${duration}ms (avg: ${Math.round(avg)}ms)`);
      
    } catch (error) {
      console.log(`❌ Notifications: ${error.message}`);
    }
    
    // Afficher les statistiques toutes les 5 tests
    if (testCount % 5 === 0) {
      console.log('\n📈 Statistiques:');
      if (results.session.length > 0) {
        const sessionAvg = results.session.reduce((a, b) => a + b, 0) / results.session.length;
        const sessionMax = Math.max(...results.session);
        console.log(`   Session - Avg: ${Math.round(sessionAvg)}ms, Max: ${sessionMax}ms`);
      }
      if (results.notifications.length > 0) {
        const notifAvg = results.notifications.reduce((a, b) => a + b, 0) / results.notifications.length;
        const notifMax = Math.max(...results.notifications);
        console.log(`   Notifications - Avg: ${Math.round(notifAvg)}ms, Max: ${notifMax}ms`);
      }
    }
    
  }, 5000); // Test toutes les 5 secondes
  
  // Arrêter proprement avec Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Arrêt de la surveillance...');
    clearInterval(interval);
    
    console.log('\n📊 Résumé final:');
    if (results.session.length > 0) {
      const sessionAvg = results.session.reduce((a, b) => a + b, 0) / results.session.length;
      console.log(`   Session API - ${results.session.length} tests, avg: ${Math.round(sessionAvg)}ms`);
    }
    if (results.notifications.length > 0) {
      const notifAvg = results.notifications.reduce((a, b) => a + b, 0) / results.notifications.length;
      console.log(`   Notifications API - ${results.notifications.length} tests, avg: ${Math.round(notifAvg)}ms`);
    }
    
    process.exit(0);
  });
}

async function main() {
  const serverOnline = await checkServerHealth();
  
  if (!serverOnline) {
    console.log('\n❌ Impossible de continuer sans serveur');
    process.exit(1);
  }
  
  await testAPIs();
  
  console.log('\n🎯 Résultats:');
  console.log('• 🟢 = Performance excellente');
  console.log('• 🟡 = Performance acceptable');
  console.log('• 🔴 = Performance dégradée');
  console.log('• ❌ = Erreur');
  
  console.log('\n💡 Options:');
  console.log('• Tapez "m" pour surveillance continue');
  console.log('• Tapez "q" pour quitter');
  console.log('• Ou appuyez sur Entrée pour un nouveau test');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', async (key) => {
    const input = key.toString();
    
    if (input === 'q' || input === '\u0003') { // q ou Ctrl+C
      console.log('\n👋 Au revoir !');
      process.exit(0);
    } else if (input === 'm') {
      process.stdin.setRawMode(false);
      await monitorContinuous();
    } else if (input === '\r' || input === '\n') { // Entrée
      console.log('\n🔄 Nouveau test...');
      await testAPIs();
      console.log('\n💡 Tapez "m" pour surveillance, "q" pour quitter, Entrée pour nouveau test');
    }
  });
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});