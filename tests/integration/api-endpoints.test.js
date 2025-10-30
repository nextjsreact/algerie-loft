// =====================================================
// TESTS D'INTÉGRATION - API ENDPOINTS
// =====================================================
// Tests des endpoints API pour le système de réservation
// =====================================================

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Configuration
const API_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Données de test
const TEST_DATA = {
  loft: {
    name: 'API Test Loft',
    description: 'Loft pour tests API',
    address: '123 API Street, Alger',
    price_per_night: 5000,
    max_guests: 2,
    status: 'available'
  },
  customer: {
    first_name: 'API',
    last_name: 'Tester',
    email: `api-test-${Date.now()}@example.com`,
    phone: '+213555000111'
  },
  reservation: {
    check_in_date: '2024-12-20',
    check_out_date: '2024-12-23',
    guest_info: {
      primary_guest: {
        first_name: 'API',
        last_name: 'Tester',
        email: `api-test-${Date.now()}@example.com`,
        phone: '+213555000111'
      },
      total_guests: 2,
      adults: 2,
      children: 0,
      infants: 0
    },
    pricing: {
      base_price: 15000,
      nights: 3,
      nightly_rate: 5000,
      cleaning_fee: 2000,
      service_fee: 1700,
      taxes: 3553,
      total_amount: 22253,
      currency: 'DZD'
    }
  }
};

// =====================================================
// UTILITAIRES DE TEST API
// =====================================================

class APITestUtils {
  static async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json().catch(() => null);
    
    return { response, data };
  }

  static async createTestLoft() {
    const { data, error } = await supabase
      .from('lofts')
      .insert(TEST_DATA.loft)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createTestCustomer() {
    const { data, error } = await supabase
      .from('customers')
      .insert(TEST_DATA.customer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async cleanup() {
    try {
      await supabase.from('reservations').delete().like('guest_info->primary_guest->>email', 'api-test-%@example.com');
      await supabase.from('customers').delete().like('email', 'api-test-%@example.com');
      await supabase.from('lofts').delete().eq('name', 'API Test Loft');
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  }
}

// =====================================================
// TESTS DES ENDPOINTS DE RECHERCHE
// =====================================================

test.describe('API - Recherche de Lofts', () => {
  let testLoft;

  test.beforeAll(async () => {
    await APITestUtils.cleanup();
    testLoft = await APITestUtils.createTestLoft();
  });

  test.afterAll(async () => {
    await APITestUtils.cleanup();
  });

  test('GET /api/lofts - Liste tous les lofts', async () => {
    const { response, data } = await APITestUtils.makeRequest('/api/lofts');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    const loft = data.find(l => l.id === testLoft.id);
    expect(loft).toBeTruthy();
    expect(loft.name).toBe(TEST_DATA.loft.name);
  });

  test('GET /api/lofts/search - Recherche avec critères', async () => {
    const searchParams = new URLSearchParams({
      check_in: '2024-12-20',
      check_out: '2024-12-23',
      guests: '2'
    });

    const { response, data } = await APITestUtils.makeRequest(`/api/lofts/search?${searchParams}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    
    // Vérifier que notre loft test est dans les résultats
    const foundLoft = data.find(l => l.id === testLoft.id);
    expect(foundLoft).toBeTruthy();
  });

  test('GET /api/lofts/[id] - Détails d\'un loft', async () => {
    const { response, data } = await APITestUtils.makeRequest(`/api/lofts/${testLoft.id}`);
    
    expect(response.status).toBe(200);
    expect(data.id).toBe(testLoft.id);
    expect(data.name).toBe(TEST_DATA.loft.name);
    expect(data.price_per_night).toBe(TEST_DATA.loft.price_per_night);
  });

  test('GET /api/lofts/[id] - Loft inexistant', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { response } = await APITestUtils.makeRequest(`/api/lofts/${fakeId}`);
    
    expect(response.status).toBe(404);
  });
});

// =====================================================
// TESTS DES ENDPOINTS DE DISPONIBILITÉ
// =====================================================

test.describe('API - Disponibilité', () => {
  let testLoft;

  test.beforeAll(async () => {
    testLoft = await APITestUtils.createTestLoft();
  });

  test.afterAll(async () => {
    await APITestUtils.cleanup();
  });

  test('GET /api/availability/[loftId] - Vérifier disponibilité', async () => {
    const params = new URLSearchParams({
      check_in: '2024-12-20',
      check_out: '2024-12-23'
    });

    const { response, data } = await APITestUtils.makeRequest(
      `/api/availability/${testLoft.id}?${params}`
    );
    
    expect(response.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.loft_id).toBe(testLoft.id);
  });

  test('POST /api/availability/lock - Créer un verrou de réservation', async () => {
    const lockData = {
      loft_id: testLoft.id,
      check_in_date: '2024-12-25',
      check_out_date: '2024-12-28',
      session_id: 'test-session-123'
    };

    const { response, data } = await APITestUtils.makeRequest('/api/availability/lock', {
      method: 'POST',
      body: JSON.stringify(lockData)
    });
    
    expect(response.status).toBe(201);
    expect(data.lock_id).toBeTruthy();
    expect(data.expires_at).toBeTruthy();
  });
});

// =====================================================
// TESTS DES ENDPOINTS DE PRICING
// =====================================================

test.describe('API - Calcul de Prix', () => {
  let testLoft;

  test.beforeAll(async () => {
    testLoft = await APITestUtils.createTestLoft();
  });

  test.afterAll(async () => {
    await APITestUtils.cleanup();
  });

  test('POST /api/pricing/calculate - Calcul de prix', async () => {
    const pricingRequest = {
      loft_id: testLoft.id,
      check_in_date: '2024-12-20',
      check_out_date: '2024-12-23',
      guests: 2
    };

    const { response, data } = await APITestUtils.makeRequest('/api/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(pricingRequest)
    });
    
    expect(response.status).toBe(200);
    expect(data.base_price).toBeTruthy();
    expect(data.nights).toBe(3);
    expect(data.nightly_rate).toBe(TEST_DATA.loft.price_per_night);
    expect(data.total_amount).toBeGreaterThan(0);
    expect(data.currency).toBe('DZD');
  });

  test('POST /api/pricing/calculate - Données invalides', async () => {
    const invalidRequest = {
      loft_id: testLoft.id,
      check_in_date: '2024-12-25',
      check_out_date: '2024-12-20', // Date de fin avant début
      guests: 2
    };

    const { response } = await APITestUtils.makeRequest('/api/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(invalidRequest)
    });
    
    expect(response.status).toBe(400);
  });
});

// =====================================================
// TESTS DES ENDPOINTS DE RÉSERVATION
// =====================================================

test.describe('API - Réservations', () => {
  let testLoft, testCustomer;

  test.beforeAll(async () => {
    await APITestUtils.cleanup();
    testLoft = await APITestUtils.createTestLoft();
    testCustomer = await APITestUtils.createTestCustomer();
  });

  test.afterAll(async () => {
    await APITestUtils.cleanup();
  });

  test('POST /api/reservations - Créer une réservation', async () => {
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    const { response, data } = await APITestUtils.makeRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
    
    expect(response.status).toBe(201);
    expect(data.id).toBeTruthy();
    expect(data.confirmation_code).toMatch(/^[A-Z0-9]{8}$/);
    expect(data.booking_reference).toMatch(/^LA\d{8}$/);
    expect(data.status).toBe('pending');
    expect(data.loft_id).toBe(testLoft.id);
  });

  test('GET /api/reservations/[id] - Récupérer une réservation', async () => {
    // Créer d'abord une réservation
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    const { data: newReservation } = await APITestUtils.makeRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });

    // Récupérer la réservation
    const { response, data } = await APITestUtils.makeRequest(`/api/reservations/${newReservation.id}`);
    
    expect(response.status).toBe(200);
    expect(data.id).toBe(newReservation.id);
    expect(data.confirmation_code).toBe(newReservation.confirmation_code);
  });

  test('PUT /api/reservations/[id] - Modifier une réservation', async () => {
    // Créer une réservation
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    const { data: newReservation } = await APITestUtils.makeRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });

    // Modifier la réservation
    const updateData = {
      special_requests: 'Demande modifiée via API'
    };

    const { response, data } = await APITestUtils.makeRequest(`/api/reservations/${newReservation.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    expect(response.status).toBe(200);
    expect(data.special_requests).toBe(updateData.special_requests);
  });

  test('DELETE /api/reservations/[id] - Annuler une réservation', async () => {
    // Créer une réservation
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    const { data: newReservation } = await APITestUtils.makeRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });

    // Annuler la réservation
    const { response, data } = await APITestUtils.makeRequest(`/api/reservations/${newReservation.id}`, {
      method: 'DELETE'
    });
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('cancelled');
    expect(data.cancelled_at).toBeTruthy();
  });
});

// =====================================================
// TESTS DES ENDPOINTS DE PAIEMENT
// =====================================================

test.describe('API - Paiements', () => {
  let testLoft, testCustomer, testReservation;

  test.beforeAll(async () => {
    await APITestUtils.cleanup();
    testLoft = await APITestUtils.createTestLoft();
    testCustomer = await APITestUtils.createTestCustomer();
    
    // Créer une réservation pour les tests de paiement
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    const { data } = await APITestUtils.makeRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
    testReservation = data;
  });

  test.afterAll(async () => {
    await APITestUtils.cleanup();
  });

  test('POST /api/payments/intent - Créer une intention de paiement', async () => {
    const paymentData = {
      reservation_id: testReservation.id,
      amount: TEST_DATA.reservation.pricing.total_amount,
      currency: 'DZD',
      payment_method: 'card'
    };

    const { response, data } = await APITestUtils.makeRequest('/api/payments/intent', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    
    expect(response.status).toBe(201);
    expect(data.client_secret).toBeTruthy();
    expect(data.amount).toBe(paymentData.amount);
  });

  test('POST /api/payments/confirm - Confirmer un paiement', async () => {
    const confirmationData = {
      reservation_id: testReservation.id,
      payment_intent_id: 'pi_test_123456789',
      payment_method: 'card'
    };

    const { response, data } = await APITestUtils.makeRequest('/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(confirmationData)
    });
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('completed');
    expect(data.reservation_id).toBe(testReservation.id);
  });
});

// =====================================================
// TESTS DES ENDPOINTS D'ANALYTICS
// =====================================================

test.describe('API - Analytics', () => {
  test('POST /api/analytics - Envoyer des événements', async () => {
    const analyticsData = {
      events: [
        {
          event: 'page_view',
          properties: {
            page_path: '/test',
            timestamp: Date.now(),
            session_id: 'test-session-123'
          }
        },
        {
          event: 'reservation_started',
          properties: {
            loft_id: 'test-loft-id',
            timestamp: Date.now(),
            session_id: 'test-session-123'
          }
        }
      ]
    };

    const { response, data } = await APITestUtils.makeRequest('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(analyticsData)
    });
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processed).toBe(2);
  });

  test('GET /api/metrics - Métriques Prometheus', async () => {
    const { response, data } = await APITestUtils.makeRequest('/api/metrics');
    
    expect(response.status).toBe(200);
    expect(typeof data).toBe('string');
    expect(data).toContain('# HELP');
    expect(data).toContain('# TYPE');
  });
});

// =====================================================
// TESTS DE VALIDATION ET SÉCURITÉ
// =====================================================

test.describe('API - Validation et Sécurité', () => {
  test('Validation des données d\'entrée', async () => {
    const invalidData = {
      loft_id: 'invalid-uuid',
      check_in_date: 'invalid-date',
      guest_info: 'not-an-object'
    };

    const { response } = await APITestUtils.makeRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(invalidData)
    });
    
    expect(response.status).toBe(400);
  });

  test('Protection contre l\'injection SQL', async () => {
    const maliciousData = {
      loft_id: "'; DROP TABLE reservations; --",
      check_in_date: '2024-12-20'
    };

    const { response } = await APITestUtils.makeRequest('/api/lofts/search', {
      method: 'POST',
      body: JSON.stringify(maliciousData)
    });
    
    expect(response.status).toBe(400);
  });

  test('Rate limiting', async () => {
    // Faire plusieurs requêtes rapidement
    const requests = Array(20).fill().map(() => 
      APITestUtils.makeRequest('/api/lofts')
    );

    const responses = await Promise.all(requests);
    
    // Au moins une requête devrait être rate limitée
    const rateLimited = responses.some(({ response }) => response.status === 429);
    expect(rateLimited).toBe(true);
  });
});

// =====================================================
// TESTS DE PERFORMANCE API
// =====================================================

test.describe('API - Performance', () => {
  test('Temps de réponse des endpoints', async () => {
    const endpoints = [
      '/api/lofts',
      '/api/lofts/search?check_in=2024-12-20&check_out=2024-12-23',
      '/api/health'
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const { response } = await APITestUtils.makeRequest(endpoint);
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Moins de 2 secondes
    }
  });

  test('Gestion de la charge', async () => {
    // Simuler 10 requêtes simultanées
    const concurrentRequests = Array(10).fill().map(() => 
      APITestUtils.makeRequest('/api/lofts')
    );

    const startTime = Date.now();
    const responses = await Promise.all(concurrentRequests);
    const totalTime = Date.now() - startTime;
    
    // Toutes les requêtes doivent réussir
    responses.forEach(({ response }) => {
      expect(response.status).toBe(200);
    });
    
    // Le temps total ne doit pas être excessif
    expect(totalTime).toBeLessThan(5000);
  });
});