// =====================================================
// CONFIGURATION DES TESTS D'INTÉGRATION
// =====================================================
// Configuration globale pour tous les tests d'intégration
// =====================================================

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Charger les variables d'environnement de test
dotenv.config({ path: '.env.test' });

// Configuration des tests
export default defineConfig({
  // Répertoire des tests
  testDir: '../integration',
  
  // Timeout global
  timeout: 30000,
  
  // Timeout pour les assertions
  expect: {
    timeout: 5000
  },
  
  // Nombre de tentatives en cas d'échec
  retries: process.env.CI ? 2 : 1,
  
  // Parallélisation
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter pour les résultats
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],
  
  // Configuration globale
  use: {
    // URL de base pour les tests
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    // Timeout pour les actions
    actionTimeout: 10000,
    
    // Timeout pour la navigation
    navigationTimeout: 15000,
    
    // Capturer les traces en cas d'échec
    trace: 'on-first-retry',
    
    // Capturer les screenshots
    screenshot: 'only-on-failure',
    
    // Capturer les vidéos
    video: 'retain-on-failure',
    
    // Headers par défaut
    extraHTTPHeaders: {
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
    }
  },

  // Configuration des projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Serveur de développement local
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Dossiers de sortie
  outputDir: 'test-results/artifacts',
  
  // Configuration des métadonnées
  metadata: {
    testEnvironment: process.env.NODE_ENV || 'test',
    supabaseUrl: process.env.SUPABASE_URL,
    testRunId: process.env.GITHUB_RUN_ID || `local-${Date.now()}`
  }
});

// =====================================================
// UTILITAIRES DE CONFIGURATION
// =====================================================

export const TEST_CONFIG = {
  // URLs
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiURL: process.env.TEST_API_URL || 'http://localhost:3000/api',
  
  // Base de données
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // Timeouts
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
    api: 10000
  },
  
  // Données de test
  testData: {
    users: {
      valid: {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      },
      invalid: {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: ''
      }
    },
    
    reservations: {
      valid: {
        checkIn: '2024-12-25',
        checkOut: '2024-12-28',
        guests: 2
      },
      invalid: {
        checkIn: '2023-01-01', // Date passée
        checkOut: '2023-01-01', // Même date
        guests: 0
      }
    },
    
    payments: {
      validCard: {
        number: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      },
      invalidCard: {
        number: '1234567890123456',
        expiry: '01/20',
        cvc: '000',
        name: ''
      }
    }
  },
  
  // Sélecteurs CSS pour les tests
  selectors: {
    navigation: {
      logo: '[data-testid="logo"]',
      menu: '[data-testid="main-menu"]',
      mobileMenu: '[data-testid="mobile-menu"]',
      loginButton: '[data-testid="login-button"]',
      signupButton: '[data-testid="signup-button"]'
    },
    
    search: {
      form: '[data-testid="search-form"]',
      checkIn: '[data-testid="search-checkin"]',
      checkOut: '[data-testid="search-checkout"]',
      guests: '[data-testid="search-guests"]',
      location: '[data-testid="search-location"]',
      button: '[data-testid="search-button"]',
      results: '[data-testid="search-results"]'
    },
    
    loft: {
      card: '[data-testid="loft-card"]',
      details: '[data-testid="loft-details"]',
      name: '[data-testid="loft-name"]',
      price: '[data-testid="loft-price"]',
      amenities: '[data-testid="loft-amenities"]',
      bookButton: '[data-testid="book-now-button"]'
    },
    
    booking: {
      form: '[data-testid="booking-form"]',
      guestInfo: '[data-testid="guest-info"]',
      specialRequests: '[data-testid="special-requests"]',
      termsCheckbox: '[data-testid="terms-checkbox"]',
      priceSummary: '[data-testid="price-summary"]',
      totalPrice: '[data-testid="total-price"]',
      proceedButton: '[data-testid="proceed-to-payment"]'
    },
    
    payment: {
      form: '[data-testid="payment-form"]',
      cardNumber: '[data-testid="card-number"]',
      expiryDate: '[data-testid="expiry-date"]',
      cvc: '[data-testid="cvc"]',
      cardholderName: '[data-testid="cardholder-name"]',
      submitButton: '[data-testid="complete-payment"]'
    },
    
    confirmation: {
      page: '[data-testid="booking-confirmation"]',
      message: '[data-testid="confirmation-message"]',
      code: '[data-testid="confirmation-code"]',
      details: '[data-testid="booking-details"]'
    },
    
    errors: {
      general: '[data-testid="error-message"]',
      validation: '[data-testid="validation-error"]',
      network: '[data-testid="network-error"]'
    }
  },
  
  // Messages d'erreur attendus
  errorMessages: {
    fr: {
      invalidEmail: 'Adresse email invalide',
      requiredField: 'Ce champ est obligatoire',
      invalidDates: 'Les dates sélectionnées ne sont pas valides',
      paymentFailed: 'Le paiement a échoué',
      networkError: 'Erreur de connexion'
    },
    en: {
      invalidEmail: 'Invalid email address',
      requiredField: 'This field is required',
      invalidDates: 'Selected dates are not valid',
      paymentFailed: 'Payment failed',
      networkError: 'Connection error'
    }
  }
};

// =====================================================
// HOOKS GLOBAUX POUR LES TESTS
// =====================================================

export class TestHooks {
  // Setup global avant tous les tests
  static async globalSetup() {
    console.log('🚀 Démarrage des tests d\'intégration...');
    
    // Vérifier la connectivité à la base de données
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        TEST_CONFIG.supabase.url,
        TEST_CONFIG.supabase.serviceKey
      );
      
      const { error } = await supabase.from('lofts').select('count').limit(1);
      if (error) throw error;
      
      console.log('✅ Connexion à la base de données OK');
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error);
      process.exit(1);
    }
    
    // Vérifier que l'application est accessible
    try {
      const response = await fetch(`${TEST_CONFIG.baseURL}/api/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      console.log('✅ Application accessible');
    } catch (error) {
      console.error('❌ Application non accessible:', error);
      process.exit(1);
    }
  }
  
  // Cleanup global après tous les tests
  static async globalTeardown() {
    console.log('🧹 Nettoyage après les tests...');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        TEST_CONFIG.supabase.url,
        TEST_CONFIG.supabase.serviceKey
      );
      
      // Nettoyer les données de test
      await supabase.from('reservations').delete().like('guest_info->primary_guest->>email', '%test%@example.com');
      await supabase.from('customers').delete().like('email', '%test%@example.com');
      await supabase.from('lofts').delete().like('name', '%Test%');
      
      console.log('✅ Nettoyage terminé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }
  
  // Setup avant chaque test
  static async beforeEach(page) {
    // Intercepter les erreurs JavaScript
    page.on('pageerror', error => {
      console.error('❌ Erreur JavaScript:', error);
    });
    
    // Intercepter les erreurs de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Erreur console:', msg.text());
      }
    });
    
    // Intercepter les requêtes réseau échouées
    page.on('requestfailed', request => {
      console.error('❌ Requête échouée:', request.url(), request.failure());
    });
  }
  
  // Cleanup après chaque test
  static async afterEach(page, testInfo) {
    // Capturer des informations supplémentaires en cas d'échec
    if (testInfo.status !== testInfo.expectedStatus) {
      // Capturer l'état de l'application
      const url = page.url();
      const title = await page.title();
      
      console.log(`❌ Test échoué sur: ${url} (${title})`);
      
      // Capturer les logs de console
      const logs = await page.evaluate(() => {
        return window.console.logs || [];
      });
      
      if (logs.length > 0) {
        console.log('📋 Logs de console:', logs);
      }
    }
  }
}

// =====================================================
// UTILITAIRES DE TEST
// =====================================================

export class TestUtils {
  // Attendre qu'un élément soit visible
  static async waitForElement(page, selector, timeout = TEST_CONFIG.timeouts.medium) {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
  }
  
  // Remplir un formulaire
  static async fillForm(page, formData) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `[name="${field}"], [data-testid="${field}"]`;
      await page.fill(selector, value.toString());
    }
  }
  
  // Attendre une navigation
  static async waitForNavigation(page, action) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      action()
    ]);
  }
  
  // Générer des données de test uniques
  static generateTestData(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    switch (type) {
      case 'email':
        return `test-${timestamp}-${random}@example.com`;
      case 'phone':
        return `+213555${timestamp.toString().slice(-6)}`;
      case 'name':
        return `Test-${random}`;
      default:
        return `test-${timestamp}-${random}`;
    }
  }
  
  // Vérifier l'accessibilité de base
  static async checkBasicAccessibility(page) {
    // Vérifier que la page a un titre
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Vérifier la navigation au clavier
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThan(0);
  }
  
  // Vérifier la responsivité
  static async checkResponsiveness(page, viewport) {
    await page.setViewportSize(viewport);
    
    // Vérifier que le contenu principal est visible
    await TestUtils.waitForElement(page, 'main, [role="main"], [data-testid="main-content"]');
    
    // Vérifier qu'il n'y a pas de débordement horizontal
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
  }
}

// =====================================================
// MATCHERS PERSONNALISÉS
// =====================================================

expect.extend({
  toBeAfter(received, expected) {
    const pass = new Date(received) > new Date(expected);
    return {
      message: () => `expected ${received} to be after ${expected}`,
      pass
    };
  },
  
  toBeBefore(received, expected) {
    const pass = new Date(received) < new Date(expected);
    return {
      message: () => `expected ${received} to be before ${expected}`,
      pass
    };
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass
    };
  },
  
  toBeValidPhone(received) {
    const phoneRegex = /^\+\d{10,15}$/;
    const pass = phoneRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid phone number`,
      pass
    };
  }
});