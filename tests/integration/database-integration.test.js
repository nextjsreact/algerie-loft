// =====================================================
// TESTS D'INTÉGRATION - BASE DE DONNÉES
// =====================================================
// Tests d'intégration pour les opérations de base de données
// =====================================================

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Données de test
const TEST_DATA = {
  loft: {
    name: 'DB Test Loft',
    description: 'Loft pour tests de base de données',
    address: '123 DB Street, Alger',
    price_per_night: 7500,
    max_guests: 3,
    status: 'available',
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['wifi', 'kitchen', 'parking'],
    cleaning_fee: 2000,
    service_fee_percentage: 10.0,
    tax_rate: 19.0
  },
  customer: {
    first_name: 'Database',
    last_name: 'Tester',
    email: `db-test-${Date.now()}@example.com`,
    phone: '+213555222333',
    status: 'active'
  },
  reservation: {
    check_in_date: '2024-12-25',
    check_out_date: '2024-12-28',
    guest_info: {
      primary_guest: {
        first_name: 'Database',
        last_name: 'Tester',
        email: `db-test-${Date.now()}@example.com`,
        phone: '+213555222333'
      },
      total_guests: 2,
      adults: 2,
      children: 0,
      infants: 0
    },
    pricing: {
      base_price: 22500,
      nights: 3,
      nightly_rate: 7500,
      cleaning_fee: 2000,
      service_fee: 2450,
      taxes: 5130.5,
      total_amount: 32080.5,
      currency: 'DZD'
    },
    special_requests: 'Test de base de données',
    terms_accepted: true
  }
};

// =====================================================
// UTILITAIRES DE TEST DB
// =====================================================

class DBTestUtils {
  static async cleanup() {
    try {
      // Nettoyer dans l'ordre des dépendances
      await supabase.from('reservation_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('reservation_communications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('reservation_audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('reservation_locks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('reservations').delete().like('guest_info->primary_guest->>email', 'db-test-%@example.com');
      await supabase.from('customers').delete().like('email', 'db-test-%@example.com');
      await supabase.from('lofts').delete().eq('name', 'DB Test Loft');
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  }

  static async createTestData() {
    // Créer un loft
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .insert(TEST_DATA.loft)
      .select()
      .single();
    
    if (loftError) throw loftError;

    // Créer un client
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert(TEST_DATA.customer)
      .select()
      .single();
    
    if (customerError) throw customerError;

    return { loft, customer };
  }

  static async waitForTrigger(tableName, condition, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .match(condition)
        .limit(1);
      
      if (data && data.length > 0) {
        return data[0];
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Timeout waiting for ${tableName} condition`);
  }
}

// =====================================================
// TESTS DES OPÉRATIONS CRUD DE BASE
// =====================================================

test.describe('Opérations CRUD - Lofts', () => {
  test.beforeEach(async () => {
    await DBTestUtils.cleanup();
  });

  test.afterEach(async () => {
    await DBTestUtils.cleanup();
  });

  test('Créer un loft avec toutes les propriétés', async () => {
    const { data, error } = await supabase
      .from('lofts')
      .insert(TEST_DATA.loft)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.id).toBeTruthy();
    expect(data.name).toBe(TEST_DATA.loft.name);
    expect(data.price_per_night).toBe(TEST_DATA.loft.price_per_night);
    expect(data.amenities).toEqual(TEST_DATA.loft.amenities);
    expect(data.created_at).toBeTruthy();
    expect(data.updated_at).toBeTruthy();
  });

  test('Mettre à jour un loft', async () => {
    // Créer un loft
    const { data: loft } = await supabase
      .from('lofts')
      .insert(TEST_DATA.loft)
      .select()
      .single();

    // Mettre à jour
    const updateData = {
      price_per_night: 8000,
      amenities: ['wifi', 'kitchen', 'parking', 'pool']
    };

    const { data: updatedLoft, error } = await supabase
      .from('lofts')
      .update(updateData)
      .eq('id', loft.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updatedLoft.price_per_night).toBe(8000);
    expect(updatedLoft.amenities).toContain('pool');
    expect(new Date(updatedLoft.updated_at)).toBeAfter(new Date(updatedLoft.created_at));
  });

  test('Rechercher des lofts avec filtres', async () => {
    // Créer plusieurs lofts
    const lofts = [
      { ...TEST_DATA.loft, name: 'Loft Économique', price_per_night: 3000 },
      { ...TEST_DATA.loft, name: 'Loft Premium', price_per_night: 12000 },
      { ...TEST_DATA.loft, name: 'Loft Standard', price_per_night: 7500 }
    ];

    await supabase.from('lofts').insert(lofts);

    // Recherche par prix
    const { data: affordableLofts } = await supabase
      .from('lofts')
      .select('*')
      .lte('price_per_night', 8000)
      .eq('status', 'available');

    expect(affordableLofts.length).toBe(2);
    expect(affordableLofts.every(l => l.price_per_night <= 8000)).toBe(true);
  });
});

// =====================================================
// TESTS DES OPÉRATIONS CRUD - CLIENTS
// =====================================================

test.describe('Opérations CRUD - Clients', () => {
  test.beforeEach(async () => {
    await DBTestUtils.cleanup();
  });

  test.afterEach(async () => {
    await DBTestUtils.cleanup();
  });

  test('Créer un client avec validation email', async () => {
    const { data, error } = await supabase
      .from('customers')
      .insert(TEST_DATA.customer)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.id).toBeTruthy();
    expect(data.email).toBe(TEST_DATA.customer.email);
    expect(data.status).toBe('active');
  });

  test('Empêcher la création de clients avec email dupliqué', async () => {
    // Créer le premier client
    await supabase
      .from('customers')
      .insert(TEST_DATA.customer);

    // Tenter de créer un second client avec le même email
    const { error } = await supabase
      .from('customers')
      .insert(TEST_DATA.customer);

    expect(error).toBeTruthy();
    expect(error.code).toBe('23505'); // Violation de contrainte unique
  });
});

// =====================================================
// TESTS DES OPÉRATIONS COMPLEXES - RÉSERVATIONS
// =====================================================

test.describe('Opérations Complexes - Réservations', () => {
  let testLoft, testCustomer;

  test.beforeAll(async () => {
    await DBTestUtils.cleanup();
    const testData = await DBTestUtils.createTestData();
    testLoft = testData.loft;
    testCustomer = testData.customer;
  });

  test.afterAll(async () => {
    await DBTestUtils.cleanup();
  });

  test('Créer une réservation complète', async () => {
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.id).toBeTruthy();
    expect(data.confirmation_code).toMatch(/^[A-Z0-9]{8}$/);
    expect(data.booking_reference).toMatch(/^LA\d{8}$/);
    expect(data.nights).toBe(3);
    expect(data.status).toBe('pending');
  });

  test('Vérifier les triggers de génération automatique', async () => {
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id,
      confirmation_code: null, // Doit être généré automatiquement
      booking_reference: null  // Doit être généré automatiquement
    };

    const { data } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single();

    expect(data.confirmation_code).toBeTruthy();
    expect(data.booking_reference).toBeTruthy();
    expect(data.confirmation_code).toMatch(/^[A-Z0-9]{8}$/);
    expect(data.booking_reference).toMatch(/^LA\d{8}$/);
  });

  test('Vérifier l\'audit automatique des réservations', async () => {
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    // Créer la réservation
    const { data: reservation } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single();

    // Vérifier que l'audit log a été créé
    const auditLog = await DBTestUtils.waitForTrigger(
      'reservation_audit_log',
      { reservation_id: reservation.id, action: 'created' }
    );

    expect(auditLog).toBeTruthy();
    expect(auditLog.action).toBe('created');
    expect(auditLog.new_values).toBeTruthy();
  });

  test('Modifier une réservation et vérifier l\'audit', async () => {
    // Créer une réservation
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    const { data: reservation } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single();

    // Modifier la réservation
    const { data: updatedReservation } = await supabase
      .from('reservations')
      .update({ special_requests: 'Demande modifiée' })
      .eq('id', reservation.id)
      .select()
      .single();

    // Vérifier l'audit de modification
    const updateAudit = await DBTestUtils.waitForTrigger(
      'reservation_audit_log',
      { reservation_id: reservation.id, action: 'updated' }
    );

    expect(updateAudit).toBeTruthy();
    expect(updateAudit.changed_fields).toContain('special_requests');
    expect(updateAudit.old_values).toBeTruthy();
    expect(updateAudit.new_values).toBeTruthy();
  });
});

// =====================================================
// TESTS DES FONCTIONS DE BASE DE DONNÉES
// =====================================================

test.describe('Fonctions de Base de Données', () => {
  let testLoft, testCustomer;

  test.beforeAll(async () => {
    await DBTestUtils.cleanup();
    const testData = await DBTestUtils.createTestData();
    testLoft = testData.loft;
    testCustomer = testData.customer;
  });

  test.afterAll(async () => {
    await DBTestUtils.cleanup();
  });

  test('Fonction check_loft_availability', async () => {
    // Tester la disponibilité d'un loft libre
    const { data: available } = await supabase
      .rpc('check_loft_availability', {
        p_loft_id: testLoft.id,
        p_check_in: '2024-12-25',
        p_check_out: '2024-12-28'
      });

    expect(available).toBe(true);

    // Créer une réservation
    await supabase
      .from('reservations')
      .insert({
        ...TEST_DATA.reservation,
        loft_id: testLoft.id,
        customer_id: testCustomer.id,
        status: 'confirmed'
      });

    // Tester la disponibilité avec conflit
    const { data: unavailable } = await supabase
      .rpc('check_loft_availability', {
        p_loft_id: testLoft.id,
        p_check_in: '2024-12-26',
        p_check_out: '2024-12-29'
      });

    expect(unavailable).toBe(false);
  });

  test('Fonction calculate_reservation_pricing', async () => {
    const { data: pricing, error } = await supabase
      .rpc('calculate_reservation_pricing', {
        p_loft_id: testLoft.id,
        p_check_in: '2024-12-25',
        p_check_out: '2024-12-28',
        p_guests: 2
      });

    expect(error).toBeNull();
    expect(pricing.nights).toBe(3);
    expect(pricing.nightly_rate).toBe(TEST_DATA.loft.price_per_night);
    expect(pricing.base_price).toBe(TEST_DATA.loft.price_per_night * 3);
    expect(pricing.total_amount).toBeGreaterThan(pricing.base_price);
    expect(pricing.currency).toBe('DZD');
  });

  test('Fonction create_reservation_lock', async () => {
    const { data: lockId, error } = await supabase
      .rpc('create_reservation_lock', {
        p_loft_id: testLoft.id,
        p_check_in: '2024-12-30',
        p_check_out: '2025-01-02',
        p_customer_id: testCustomer.id,
        p_session_id: 'test-session-123'
      });

    expect(error).toBeNull();
    expect(lockId).toBeTruthy();

    // Vérifier que le verrou a été créé
    const { data: lock } = await supabase
      .from('reservation_locks')
      .select('*')
      .eq('id', lockId)
      .single();

    expect(lock).toBeTruthy();
    expect(lock.loft_id).toBe(testLoft.id);
    expect(lock.session_id).toBe('test-session-123');
  });

  test('Fonction cleanup_expired_locks', async () => {
    // Créer un verrou expiré
    await supabase
      .from('reservation_locks')
      .insert({
        loft_id: testLoft.id,
        check_in_date: '2024-12-25',
        check_out_date: '2024-12-28',
        locked_by: testCustomer.id,
        session_id: 'expired-session',
        expires_at: new Date(Date.now() - 60000).toISOString() // Expiré il y a 1 minute
      });

    // Nettoyer les verrous expirés
    const { data: deletedCount } = await supabase
      .rpc('cleanup_expired_locks');

    expect(deletedCount).toBeGreaterThan(0);

    // Vérifier que le verrou a été supprimé
    const { data: expiredLock } = await supabase
      .from('reservation_locks')
      .select('*')
      .eq('session_id', 'expired-session')
      .single();

    expect(expiredLock).toBeNull();
  });
});

// =====================================================
// TESTS DES CONTRAINTES ET VALIDATIONS
// =====================================================

test.describe('Contraintes et Validations', () => {
  let testLoft, testCustomer;

  test.beforeAll(async () => {
    await DBTestUtils.cleanup();
    const testData = await DBTestUtils.createTestData();
    testLoft = testData.loft;
    testCustomer = testData.customer;
  });

  test.afterAll(async () => {
    await DBTestUtils.cleanup();
  });

  test('Contrainte de dates valides', async () => {
    const invalidReservation = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id,
      check_in_date: '2024-12-28',
      check_out_date: '2024-12-25' // Date de fin avant début
    };

    const { error } = await supabase
      .from('reservations')
      .insert(invalidReservation);

    expect(error).toBeTruthy();
    expect(error.code).toBe('23514'); // Violation de contrainte CHECK
  });

  test('Contrainte de nombre d\'invités valide', async () => {
    const invalidReservation = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id,
      guest_info: {
        ...TEST_DATA.reservation.guest_info,
        total_guests: 0 // Nombre d'invités invalide
      }
    };

    const { error } = await supabase
      .from('reservations')
      .insert(invalidReservation);

    expect(error).toBeTruthy();
  });

  test('Contrainte de prix positif', async () => {
    const invalidReservation = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id,
      pricing: {
        ...TEST_DATA.reservation.pricing,
        total_amount: -100 // Prix négatif
      }
    };

    const { error } = await supabase
      .from('reservations')
      .insert(invalidReservation);

    expect(error).toBeTruthy();
  });
});

// =====================================================
// TESTS DE PERFORMANCE DE BASE DE DONNÉES
// =====================================================

test.describe('Performance de Base de Données', () => {
  test.beforeAll(async () => {
    await DBTestUtils.cleanup();
  });

  test.afterAll(async () => {
    await DBTestUtils.cleanup();
  });

  test('Performance des requêtes de recherche', async () => {
    // Créer plusieurs lofts pour tester la performance
    const lofts = Array(50).fill().map((_, i) => ({
      ...TEST_DATA.loft,
      name: `Performance Test Loft ${i}`,
      price_per_night: 5000 + (i * 100)
    }));

    await supabase.from('lofts').insert(lofts);

    // Tester la performance de recherche
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('lofts')
      .select('*')
      .eq('status', 'available')
      .gte('price_per_night', 6000)
      .lte('price_per_night', 8000)
      .order('price_per_night');

    const queryTime = Date.now() - startTime;

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
    expect(queryTime).toBeLessThan(1000); // Moins d'1 seconde
  });

  test('Performance des requêtes avec JSONB', async () => {
    const { loft, customer } = await DBTestUtils.createTestData();

    // Créer plusieurs réservations avec des données JSONB
    const reservations = Array(20).fill().map((_, i) => ({
      ...TEST_DATA.reservation,
      loft_id: loft.id,
      customer_id: customer.id,
      guest_info: {
        ...TEST_DATA.reservation.guest_info,
        primary_guest: {
          ...TEST_DATA.reservation.guest_info.primary_guest,
          email: `perf-test-${i}@example.com`
        }
      }
    }));

    await supabase.from('reservations').insert(reservations);

    // Tester la recherche dans JSONB
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .like('guest_info->primary_guest->>email', 'perf-test-%@example.com');

    const queryTime = Date.now() - startTime;

    expect(error).toBeNull();
    expect(data.length).toBe(20);
    expect(queryTime).toBeLessThan(500); // Moins de 500ms
  });
});

// =====================================================
// TESTS DE CONCURRENCE
// =====================================================

test.describe('Tests de Concurrence', () => {
  let testLoft, testCustomer;

  test.beforeAll(async () => {
    await DBTestUtils.cleanup();
    const testData = await DBTestUtils.createTestData();
    testLoft = testData.loft;
    testCustomer = testData.customer;
  });

  test.afterAll(async () => {
    await DBTestUtils.cleanup();
  });

  test('Prévention des double réservations', async () => {
    const reservationData = {
      ...TEST_DATA.reservation,
      loft_id: testLoft.id,
      customer_id: testCustomer.id
    };

    // Créer deux réservations simultanément pour les mêmes dates
    const promises = [
      supabase.from('reservations').insert(reservationData),
      supabase.from('reservations').insert({
        ...reservationData,
        check_in_date: '2024-12-26', // Chevauchement
        check_out_date: '2024-12-29'
      })
    ];

    const results = await Promise.allSettled(promises);
    
    // Une des deux réservations doit échouer
    const successes = results.filter(r => r.status === 'fulfilled' && !r.value.error);
    expect(successes.length).toBeLessThanOrEqual(1);
  });

  test('Gestion des verrous concurrents', async () => {
    const lockPromises = Array(5).fill().map((_, i) =>
      supabase.rpc('create_reservation_lock', {
        p_loft_id: testLoft.id,
        p_check_in: '2025-01-10',
        p_check_out: '2025-01-13',
        p_customer_id: testCustomer.id,
        p_session_id: `concurrent-session-${i}`
      })
    );

    const results = await Promise.allSettled(lockPromises);
    
    // Seul un verrou doit réussir
    const successes = results.filter(r => r.status === 'fulfilled' && !r.value.error);
    expect(successes.length).toBe(1);
  });
});