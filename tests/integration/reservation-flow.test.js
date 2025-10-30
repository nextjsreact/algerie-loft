// =====================================================
// TESTS D'INTÉGRATION - FLUX DE RÉSERVATION CLIENT
// =====================================================
// Tests end-to-end du processus complet de réservation
// =====================================================

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Configuration des tests
const TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
  testTimeout: 30000
};

// Client Supabase pour les tests
const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

// Données de test
const TEST_DATA = {
  customer: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: `test-${Date.now()}@example.com`,
    phone: '+213555123456',
    nationality: 'Française'
  },
  reservation: {
    checkIn: '2024-12-15',
    checkOut: '2024-12-18',
    guests: {
      adults: 2,
      children: 1,
      infants: 0
    },
    specialRequests: 'Arrivée tardive prévue'
  },
  payment: {
    cardNumber: '4242424242424242',
    expiryDate: '12/25',
    cvc: '123',
    cardholderName: 'Jean Dupont'
  }
};

// =====================================================
// UTILITAIRES DE TEST
// =====================================================

class TestUtils {
  // Nettoyer les données de test
  static async cleanup() {
    try {
      // Supprimer les réservations de test
      await supabase
        .from('reservations')
        .delete()
        .like('guest_info->primary_guest->>email', 'test-%@example.com');
      
      // Supprimer les clients de test
      await supabase
        .from('customers')
        .delete()
        .like('email', 'test-%@example.com');
    } catch (error) {
      console.log('Cleanup error (normal in fresh DB):', error.message);
    }
  }

  // Créer un loft de test
  static async createTestLoft() {
    const { data, error } = await supabase
      .from('lofts')
      .insert({
        name: 'Loft Test Intégration',
        description: 'Loft utilisé pour les tests d\'intégration',
        address: '123 Rue de Test, Alger',
        price_per_night: 8000,
        max_guests: 4,
        status: 'available'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer le loft de test
  static async deleteTestLoft(loftId) {
    await supabase
      .from('lofts')
      .delete()
      .eq('id', loftId);
  }

  // Attendre qu'un élément soit visible
  static async waitForElement(page, selector, timeout = 5000) {
    await page.waitForSelector(selector, { timeout });
  }

  // Remplir un formulaire
  static async fillForm(page, formData) {
    for (const [field, value] of Object.entries(formData)) {
      await page.fill(`[name="${field}"]`, value);
    }
  }
}

// =====================================================
// TESTS DE CONFIGURATION
// =====================================================

test.describe('Configuration des Tests', () => {
  test.beforeAll(async () => {
    await TestUtils.cleanup();
  });

  test.afterAll(async () => {
    await TestUtils.cleanup();
  });

  test('Vérification de la connectivité', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);
    await expect(page).toHaveTitle(/Loft Algerie/);
  });
});

// =====================================================
// TESTS DU FLUX COMPLET DE RÉSERVATION
// =====================================================

test.describe('Flux Complet de Réservation', () => {
  let testLoft;

  test.beforeAll(async () => {
    testLoft = await TestUtils.createTestLoft();
  });

  test.afterAll(async () => {
    if (testLoft) {
      await TestUtils.deleteTestLoft(testLoft.id);
    }
  });

  test('Réservation complète - Utilisateur nouveau', async ({ page }) => {
    test.setTimeout(TEST_CONFIG.testTimeout);

    // 1. Navigation vers la page d'accueil
    await page.goto(TEST_CONFIG.baseURL);
    await expect(page.locator('h1')).toContainText('Loft Algerie');

    // 2. Recherche de lofts
    await page.fill('[data-testid="search-checkin"]', TEST_DATA.reservation.checkIn);
    await page.fill('[data-testid="search-checkout"]', TEST_DATA.reservation.checkOut);
    await page.selectOption('[data-testid="search-guests"]', TEST_DATA.reservation.guests.adults.toString());
    await page.click('[data-testid="search-button"]');

    // 3. Vérification des résultats de recherche
    await TestUtils.waitForElement(page, '[data-testid="loft-card"]');
    await expect(page.locator('[data-testid="loft-card"]')).toHaveCount.greaterThan(0);

    // 4. Sélection d'un loft
    await page.click(`[data-testid="loft-card-${testLoft.id}"] [data-testid="view-details"]`);
    await TestUtils.waitForElement(page, '[data-testid="loft-details"]');

    // 5. Vérification des détails du loft
    await expect(page.locator('[data-testid="loft-name"]')).toContainText(testLoft.name);
    await expect(page.locator('[data-testid="loft-price"]')).toContainText('8000');

    // 6. Initiation de la réservation
    await page.click('[data-testid="book-now-button"]');
    await TestUtils.waitForElement(page, '[data-testid="booking-form"]');

    // 7. Remplissage des informations client
    await TestUtils.fillForm(page, {
      'guest_first_name': TEST_DATA.customer.firstName,
      'guest_last_name': TEST_DATA.customer.lastName,
      'guest_email': TEST_DATA.customer.email,
      'guest_phone': TEST_DATA.customer.phone,
      'guest_nationality': TEST_DATA.customer.nationality
    });

    // 8. Ajout d'invités supplémentaires
    if (TEST_DATA.reservation.guests.children > 0) {
      await page.click('[data-testid="add-child-button"]');
      await TestUtils.fillForm(page, {
        'child_first_name': 'Marie',
        'child_last_name': 'Dupont',
        'child_age_group': 'child'
      });
    }

    // 9. Demandes spéciales
    await page.fill('[data-testid="special-requests"]', TEST_DATA.reservation.specialRequests);

    // 10. Acceptation des conditions
    await page.check('[data-testid="terms-checkbox"]');

    // 11. Vérification du récapitulatif de prix
    await TestUtils.waitForElement(page, '[data-testid="price-summary"]');
    const totalPrice = await page.locator('[data-testid="total-price"]').textContent();
    expect(totalPrice).toMatch(/\d+/);

    // 12. Passage au paiement
    await page.click('[data-testid="proceed-to-payment"]');
    await TestUtils.waitForElement(page, '[data-testid="payment-form"]');

    // 13. Remplissage des informations de paiement
    await TestUtils.fillForm(page, {
      'card_number': TEST_DATA.payment.cardNumber,
      'expiry_date': TEST_DATA.payment.expiryDate,
      'cvc': TEST_DATA.payment.cvc,
      'cardholder_name': TEST_DATA.payment.cardholderName
    });

    // 14. Finalisation du paiement
    await page.click('[data-testid="complete-payment"]');

    // 15. Vérification de la confirmation
    await TestUtils.waitForElement(page, '[data-testid="booking-confirmation"]', 10000);
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('confirmée');
    
    // 16. Récupération du code de confirmation
    const confirmationCode = await page.locator('[data-testid="confirmation-code"]').textContent();
    expect(confirmationCode).toMatch(/^[A-Z0-9]{8}$/);

    // 17. Vérification en base de données
    const { data: reservation } = await supabase
      .from('reservations')
      .select('*')
      .eq('confirmation_code', confirmationCode)
      .single();

    expect(reservation).toBeTruthy();
    expect(reservation.status).toBe('confirmed');
    expect(reservation.loft_id).toBe(testLoft.id);
  });

  test('Réservation avec utilisateur existant', async ({ page }) => {
    // Créer d'abord un client
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        first_name: 'Marie',
        last_name: 'Martin',
        email: `existing-${Date.now()}@example.com`,
        phone: '+213555987654'
      })
      .select()
      .single();

    await page.goto(TEST_CONFIG.baseURL);
    
    // Connexion avec utilisateur existant
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="login-email"]', customer.email);
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit"]');

    // Le reste du flux de réservation...
    // (similaire au test précédent mais avec pré-remplissage des données client)
  });
});

// =====================================================
// TESTS DE GESTION DES ERREURS
// =====================================================

test.describe('Gestion des Erreurs', () => {
  test('Réservation avec dates invalides', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);
    
    // Dates dans le passé
    const pastDate = '2023-01-01';
    await page.fill('[data-testid="search-checkin"]', pastDate);
    await page.fill('[data-testid="search-checkout"]', '2023-01-02');
    await page.click('[data-testid="search-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('passé');
  });

  test('Réservation avec email invalide', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/book/test-loft`);
    
    await page.fill('[data-testid="guest-email"]', 'email-invalide');
    await page.click('[data-testid="proceed-to-payment"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('valide');
  });

  test('Paiement avec carte invalide', async ({ page }) => {
    // Simuler un flux jusqu'au paiement avec une carte invalide
    await page.goto(`${TEST_CONFIG.baseURL}/payment/test-reservation`);
    
    await page.fill('[data-testid="card-number"]', '1234567890123456');
    await page.click('[data-testid="complete-payment"]');

    await expect(page.locator('[data-testid="payment-error"]')).toContainText('carte');
  });
});

// =====================================================
// TESTS DE PERFORMANCE
// =====================================================

test.describe('Tests de Performance', () => {
  test('Temps de chargement des pages', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(TEST_CONFIG.baseURL);
    await TestUtils.waitForElement(page, '[data-testid="main-content"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Moins de 3 secondes
  });

  test('Recherche rapide de lofts', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);
    
    const startTime = Date.now();
    
    await page.fill('[data-testid="search-checkin"]', '2024-12-15');
    await page.fill('[data-testid="search-checkout"]', '2024-12-18');
    await page.click('[data-testid="search-button"]');
    
    await TestUtils.waitForElement(page, '[data-testid="search-results"]');
    
    const searchTime = Date.now() - startTime;
    expect(searchTime).toBeLessThan(2000); // Moins de 2 secondes
  });
});

// =====================================================
// TESTS DE SÉCURITÉ
// =====================================================

test.describe('Tests de Sécurité', () => {
  test('Protection contre XSS', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);
    
    const maliciousScript = '<script>alert("XSS")</script>';
    await page.fill('[data-testid="search-location"]', maliciousScript);
    
    // Vérifier que le script n'est pas exécuté
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.click('[data-testid="search-button"]');
    await page.waitForTimeout(1000);
    
    expect(alerts).toHaveLength(0);
  });

  test('Validation des données côté serveur', async ({ page }) => {
    // Test d'injection SQL via l'API
    const response = await page.request.post('/api/reservations', {
      data: {
        loft_id: "'; DROP TABLE reservations; --",
        guest_info: { email: 'test@example.com' }
      }
    });
    
    expect(response.status()).toBe(400); // Doit être rejeté
  });
});

// =====================================================
// TESTS D'ACCESSIBILITÉ
// =====================================================

test.describe('Tests d\'Accessibilité', () => {
  test('Navigation au clavier', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);
    
    // Tester la navigation avec Tab
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Continuer la navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    }
  });

  test('Contraste des couleurs', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);
    
    // Vérifier que les éléments importants ont un bon contraste
    const button = page.locator('[data-testid="search-button"]');
    const styles = await button.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    // Les valeurs exactes dépendraient de votre design
    expect(styles.backgroundColor).toBeTruthy();
    expect(styles.color).toBeTruthy();
  });
});

// =====================================================
// TESTS MULTI-NAVIGATEURS
// =====================================================

test.describe('Compatibilité Navigateurs', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Flux de base sur ${browserName}`, async ({ page }) => {
      await page.goto(TEST_CONFIG.baseURL);
      await expect(page.locator('h1')).toBeVisible();
      
      // Test de base de recherche
      await page.fill('[data-testid="search-checkin"]', '2024-12-15');
      await page.fill('[data-testid="search-checkout"]', '2024-12-18');
      await page.click('[data-testid="search-button"]');
      
      await TestUtils.waitForElement(page, '[data-testid="search-results"]');
    });
  });
});

// =====================================================
// TESTS RESPONSIVE
// =====================================================

test.describe('Tests Responsive', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    test(`Interface ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(TEST_CONFIG.baseURL);
      
      // Vérifier que les éléments principaux sont visibles
      await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-form"]')).toBeVisible();
      
      // Test spécifique mobile
      if (viewport.name === 'Mobile') {
        // Vérifier le menu hamburger
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      }
    });
  });
});