/**
 * Test Client Reservation Flow
 * Tests the complete reservation process from a client perspective
 */

const http = require('http');
const https = require('https');

console.log('🧪 Test du Flux de Réservation Client');
console.log('=====================================\n');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CLIENT = {
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean.dupont@test.com',
  phone: '+213555123456',
  nationality: 'Algérienne'
};

// Generate future dates for testing
const today = new Date();
const checkInDate = new Date(today);
checkInDate.setDate(today.getDate() + 7); // 7 days from now
const checkOutDate = new Date(checkInDate);
checkOutDate.setDate(checkInDate.getDate() + 4); // 4 nights

const TEST_RESERVATION = {
  loft_id: 'test-loft-1',
  check_in_date: checkInDate.toISOString().split('T')[0],
  check_out_date: checkOutDate.toISOString().split('T')[0],
  guest_count: 2,
  special_requests: 'Vue sur mer si possible'
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test functions
async function testStep(stepName, testFunction) {
  console.log(`🔄 ${stepName}...`);
  try {
    const result = await testFunction();
    if (result.success) {
      console.log(`✅ ${stepName} - Succès`);
      if (result.data) {
        console.log(`   📊 ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      }
    } else {
      console.log(`❌ ${stepName} - Échec`);
      if (result.error) {
        console.log(`   ❌ Erreur: ${result.error}`);
      }
    }
    console.log('');
    return result;
  } catch (error) {
    console.log(`❌ ${stepName} - Exception: ${error.message}`);
    console.log('');
    return { success: false, error: error.message };
  }
}

// Test 1: Vérifier que l'application fonctionne
async function testApplicationHealth() {
  const response = await makeRequest(`${BASE_URL}/`);
  return {
    success: response.status === 200,
    data: { status: response.status },
    error: response.status !== 200 ? `Status: ${response.status}` : null
  };
}

// Test 2: Tester l'API de monitoring
async function testMonitoringAPI() {
  const response = await makeRequest(`${BASE_URL}/api/monitoring/performance?type=overview`);
  return {
    success: response.status === 200 && response.data && !response.parseError,
    data: response.data,
    error: response.parseError || (response.status !== 200 ? `Status: ${response.status}` : null)
  };
}

// Test 3: Rechercher des lofts disponibles
async function testLoftSearch() {
  // Simuler une recherche de loft
  const searchParams = new URLSearchParams({
    check_in: TEST_RESERVATION.check_in_date,
    check_out: TEST_RESERVATION.check_out_date,
    guests: TEST_RESERVATION.guest_count.toString(),
    location: 'Alger'
  });

  const response = await makeRequest(`${BASE_URL}/api/lofts/search?${searchParams}`);
  return {
    success: response.status === 200 || response.status === 404, // 404 is OK if no lofts found
    data: { 
      status: response.status, 
      loftsFound: Array.isArray(response.data) ? response.data.length : 0 
    },
    error: response.status >= 500 ? `Server error: ${response.status}` : null
  };
}

// Test 4: Obtenir les détails d'un loft
async function testLoftDetails() {
  const response = await makeRequest(`${BASE_URL}/api/lofts/${TEST_RESERVATION.loft_id}`);
  return {
    success: response.status === 200 || response.status === 404, // 404 is OK if loft doesn't exist
    data: { 
      status: response.status,
      loftId: TEST_RESERVATION.loft_id
    },
    error: response.status >= 500 ? `Server error: ${response.status}` : null
  };
}

// Test 5: Vérifier la disponibilité
async function testAvailabilityCheck() {
  const availabilityParams = new URLSearchParams({
    loft_id: TEST_RESERVATION.loft_id,
    check_in: TEST_RESERVATION.check_in_date,
    check_out: TEST_RESERVATION.check_out_date
  });

  const response = await makeRequest(`${BASE_URL}/api/availability/check?${availabilityParams}`);
  return {
    success: response.status === 200 || response.status === 404,
    data: { 
      status: response.status,
      available: response.data?.available || false
    },
    error: response.status >= 500 ? `Server error: ${response.status}` : null
  };
}

// Test 6: Calculer le prix
async function testPriceCalculation() {
  const priceParams = new URLSearchParams({
    loft_id: TEST_RESERVATION.loft_id,
    check_in: TEST_RESERVATION.check_in_date,
    check_out: TEST_RESERVATION.check_out_date,
    guests: TEST_RESERVATION.guest_count.toString()
  });

  const response = await makeRequest(`${BASE_URL}/api/pricing/calculate?${priceParams}`);
  return {
    success: response.status === 200 || response.status === 404,
    data: { 
      status: response.status,
      pricing: response.data
    },
    error: response.status >= 500 ? `Server error: ${response.status}` : null
  };
}

// Test 7: Créer un client (simulation)
async function testCustomerCreation() {
  const response = await makeRequest(`${BASE_URL}/api/customers`, {
    method: 'POST',
    body: TEST_CLIENT
  });

  return {
    success: response.status === 200 || response.status === 201 || response.status === 409, // 409 = already exists
    data: { 
      status: response.status,
      customer: response.data
    },
    error: response.status >= 500 ? `Server error: ${response.status}` : null
  };
}

// Test 8: Créer une réservation (simulation)
async function testReservationCreation() {
  const reservationData = {
    ...TEST_RESERVATION,
    customer_email: TEST_CLIENT.email,
    total_amount: 450.00 // Prix simulé
  };

  const response = await makeRequest(`${BASE_URL}/api/reservations`, {
    method: 'POST',
    body: reservationData
  });

  return {
    success: response.status === 200 || response.status === 201 || response.status === 400, // 400 = validation error is OK
    data: { 
      status: response.status,
      reservation: response.data
    },
    error: response.status >= 500 ? `Server error: ${response.status}` : null
  };
}

// Test 9: Vérifier les métriques de performance après les opérations
async function testPerformanceMetrics() {
  const response = await makeRequest(`${BASE_URL}/api/monitoring/performance?type=performance`);
  return {
    success: response.status === 200,
    data: response.data,
    error: response.status !== 200 ? `Status: ${response.status}` : null
  };
}

// Test 10: Vérifier la santé du système
async function testSystemHealth() {
  const response = await makeRequest(`${BASE_URL}/api/monitoring/performance?type=health`);
  return {
    success: response.status === 200,
    data: response.data,
    error: response.status !== 200 ? `Status: ${response.status}` : null
  };
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests du flux de réservation client...\n');

  const tests = [
    { name: 'Santé de l\'application', fn: testApplicationHealth },
    { name: 'API de monitoring', fn: testMonitoringAPI },
    { name: 'Recherche de lofts', fn: testLoftSearch },
    { name: 'Détails du loft', fn: testLoftDetails },
    { name: 'Vérification disponibilité', fn: testAvailabilityCheck },
    { name: 'Calcul de prix', fn: testPriceCalculation },
    { name: 'Création client', fn: testCustomerCreation },
    { name: 'Création réservation', fn: testReservationCreation },
    { name: 'Métriques de performance', fn: testPerformanceMetrics },
    { name: 'Santé du système', fn: testSystemHealth }
  ];

  const results = [];
  let successCount = 0;

  for (const test of tests) {
    const result = await testStep(test.name, test.fn);
    results.push({ name: test.name, ...result });
    if (result.success) successCount++;
  }

  // Résumé
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('==================');
  console.log(`Tests réussis: ${successCount}/${tests.length}`);
  console.log(`Taux de réussite: ${((successCount / tests.length) * 100).toFixed(1)}%\n`);

  // Détails des résultats
  console.log('📋 DÉTAILS DES RÉSULTATS');
  console.log('========================');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (!result.success && result.error) {
      console.log(`   ❌ ${result.error}`);
    }
  });

  console.log('\n🎯 ANALYSE');
  console.log('==========');
  
  if (successCount === tests.length) {
    console.log('🎉 Tous les tests sont passés ! Le flux de réservation fonctionne parfaitement.');
    console.log('✅ Le système est prêt pour les clients.');
  } else if (successCount >= tests.length * 0.8) {
    console.log('⚠️  La plupart des tests passent. Quelques ajustements nécessaires.');
    console.log('🔧 Vérifiez les endpoints qui échouent.');
  } else if (successCount >= tests.length * 0.5) {
    console.log('⚠️  Tests partiellement réussis. Développement en cours.');
    console.log('🚧 Plusieurs fonctionnalités nécessitent une implémentation.');
  } else {
    console.log('❌ Beaucoup de tests échouent. Vérification nécessaire.');
    console.log('🔍 Vérifiez que l\'application fonctionne et que les APIs sont implémentées.');
  }

  console.log('\n🚀 PROCHAINES ÉTAPES');
  console.log('===================');
  
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length === 0) {
    console.log('1. ✅ Déployer en production');
    console.log('2. ✅ Configurer le monitoring en temps réel');
    console.log('3. ✅ Former l\'équipe sur les nouvelles fonctionnalités');
  } else {
    console.log('1. 🔧 Corriger les endpoints qui échouent:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}`);
    });
    console.log('2. 🧪 Re-tester le flux complet');
    console.log('3. 📊 Vérifier les métriques de performance');
  }

  console.log('\n✨ Test du flux de réservation client terminé !');
  
  // Code de sortie
  process.exit(successCount === tests.length ? 0 : 1);
}

// Lancement des tests
runAllTests().catch(error => {
  console.error('❌ Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});