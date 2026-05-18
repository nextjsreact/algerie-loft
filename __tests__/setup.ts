/**
 * Jest Setup File
 * 
 * Configuration globale pour tous les tests
 */

// Mock des variables d'environnement pour les tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.ADMIN_EMAIL = 'test@example.com';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.API_SECRET = 'test-api-secret';

// Augmenter le timeout pour les tests d'intégration
jest.setTimeout(30000);

// Mock console pour réduire le bruit dans les tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
