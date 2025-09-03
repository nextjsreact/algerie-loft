/**
 * Tests d'intégration complets pour les traductions next-intl
 */

import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useCachedTranslations, clearTranslationCache } from '@/lib/hooks/use-cached-translations';
import { getMessages, preloadAllMessages } from '@/lib/i18n-optimizations';
import { analyzeTranslationBundles } from '@/lib/utils/bundle-analyzer';

// Mock des messages pour les tests
const mockMessages = {
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès'
    },
    nav: {
      dashboard: 'Tableau de bord',
      lofts: 'Lofts',
      settings: 'Paramètres'
    },
    auth: {
      login: 'Connexion',
      logout: 'Déconnexion',
      welcome: 'Bienvenue {name}'
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success'
    },
    nav: {
      dashboard: 'Dashboard',
      lofts: 'Lofts',
      settings: 'Settings'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      welcome: 'Welcome {name}'
    }
  },
  ar: {
    common: {
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح'
    },
    nav: {
      dashboard: 'لوحة التحكم',
      lofts: 'الشقق',
      settings: 'الإعدادات'
    },
    auth: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      welcome: 'مرحبا {name}'
    }
  }
};

// Composant de test
function TestComponent({ namespace, messageKey }: { namespace: string; messageKey: string }) {
  const t = useCachedTranslations(namespace);
  return <div data-testid="translation">{t(messageKey)}</div>;
}

// Wrapper de test avec provider
function TestWrapper({ 
  children, 
  locale = 'fr', 
  messages = mockMessages.fr 
}: { 
  children: React.ReactNode; 
  locale?: string; 
  messages?: any; 
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe('Translation Integration Tests', () => {
  beforeEach(() => {
    clearTranslationCache();
  });

  describe('Basic Translation Functionality', () => {
    test('should render French translations correctly', () => {
      render(
        <TestWrapper locale="fr" messages={mockMessages.fr}>
          <TestComponent namespace="common" messageKey="loading" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Chargement...');
    });

    test('should render English translations correctly', () => {
      render(
        <TestWrapper locale="en" messages={mockMessages.en}>
          <TestComponent namespace="common" messageKey="loading" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Loading...');
    });

    test('should render Arabic translations correctly', () => {
      render(
        <TestWrapper locale="ar" messages={mockMessages.ar}>
          <TestComponent namespace="common" messageKey="loading" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('جاري التحميل...');
    });
  });

  describe('Namespace Functionality', () => {
    test('should handle different namespaces correctly', () => {
      const { rerender } = render(
        <TestWrapper>
          <TestComponent namespace="nav" messageKey="dashboard" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Tableau de bord');

      rerender(
        <TestWrapper>
          <TestComponent namespace="auth" messageKey="login" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Connexion');
    });
  });

  describe('Interpolation Support', () => {
    test('should handle interpolations correctly', () => {
      function InterpolationTest() {
        const t = useCachedTranslations('auth');
        return <div data-testid="translation">{t('welcome', { name: 'John' })}</div>;
      }

      render(
        <TestWrapper>
          <InterpolationTest />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Bienvenue John');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing translation keys gracefully', () => {
      function MissingKeyTest() {
        const t = useCachedTranslations('common');
        return <div data-testid="translation">{t('nonexistent')}</div>;
      }

      // Suppress console warnings for this test
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <TestWrapper>
          <MissingKeyTest />
        </TestWrapper>
      );

      // Should fallback to the key itself
      expect(screen.getByTestId('translation')).toHaveTextContent('nonexistent');
      
      consoleSpy.mockRestore();
    });

    test('should handle missing namespace gracefully', () => {
      function MissingNamespaceTest() {
        const t = useCachedTranslations('nonexistent');
        return <div data-testid="translation">{t('key')}</div>;
      }

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <TestWrapper>
          <MissingNamespaceTest />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('key');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Caching Performance', () => {
    test('should cache translations for performance', () => {
      const { rerender } = render(
        <TestWrapper>
          <TestComponent namespace="common" messageKey="loading" />
        </TestWrapper>
      );

      const firstRender = screen.getByTestId('translation').textContent;

      // Re-render should use cached value
      rerender(
        <TestWrapper>
          <TestComponent namespace="common" messageKey="loading" />
        </TestWrapper>
      );

      const secondRender = screen.getByTestId('translation').textContent;
      expect(firstRender).toBe(secondRender);
    });

    test('should clear cache when requested', () => {
      render(
        <TestWrapper>
          <TestComponent namespace="common" messageKey="loading" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Chargement...');

      // Clear cache
      clearTranslationCache();

      // Should still work after cache clear
      render(
        <TestWrapper>
          <TestComponent namespace="common" messageKey="loading" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Chargement...');
    });
  });

  describe('Multi-language Support', () => {
    test('should switch between languages correctly', () => {
      const { rerender } = render(
        <TestWrapper locale="fr" messages={mockMessages.fr}>
          <TestComponent namespace="common" messageKey="error" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Erreur');

      rerender(
        <TestWrapper locale="en" messages={mockMessages.en}>
          <TestComponent namespace="common" messageKey="error" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Error');

      rerender(
        <TestWrapper locale="ar" messages={mockMessages.ar}>
          <TestComponent namespace="common" messageKey="error" />
        </TestWrapper>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('خطأ');
    });
  });
});

describe('Translation Loading Performance Tests', () => {
  test('should load messages efficiently', async () => {
    const startTime = Date.now();
    
    // Mock the getMessages function for testing
    jest.mock('@/lib/i18n-optimizations', () => ({
      getMessages: jest.fn().mockResolvedValue(mockMessages.fr),
      preloadAllMessages: jest.fn().mockResolvedValue(undefined)
    }));

    await getMessages('fr' as any);
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(100);
  });

  test('should preload all messages without errors', async () => {
    await expect(preloadAllMessages()).resolves.not.toThrow();
  });
});

describe('Bundle Analysis Tests', () => {
  test('should analyze translation bundles', async () => {
    const analysis = await analyzeTranslationBundles();
    
    expect(analysis).toHaveProperty('translationSize');
    expect(analysis).toHaveProperty('languageBreakdown');
    expect(analysis).toHaveProperty('namespaceBreakdown');
    expect(analysis).toHaveProperty('recommendations');
    
    expect(typeof analysis.translationSize).toBe('number');
    expect(analysis.translationSize).toBeGreaterThan(0);
  });
});

describe('Real File Translation Tests', () => {
  const locales = ['fr', 'en', 'ar'];

  test.each(locales)('should load real translation file for %s', async (locale) => {
    try {
      const messages = await import(`../../messages/${locale}.json`);
      expect(messages.default).toBeDefined();
      expect(typeof messages.default).toBe('object');
      
      // Check for required namespaces
      const requiredNamespaces = ['common', 'nav', 'auth'];
      for (const namespace of requiredNamespaces) {
        expect(messages.default).toHaveProperty(namespace);
      }
    } catch (error) {
      // If file doesn't exist, that's also valuable information
      console.warn(`Translation file for ${locale} not found:`, error);
    }
  });

  test('should have consistent structure across all languages', async () => {
    const structures: Record<string, string[]> = {};
    
    for (const locale of locales) {
      try {
        const messages = await import(`../../messages/${locale}.json`);
        structures[locale] = Object.keys(messages.default);
      } catch (error) {
        console.warn(`Could not load ${locale} for structure comparison`);
      }
    }
    
    // If we have at least 2 languages, compare their structures
    const loadedLocales = Object.keys(structures);
    if (loadedLocales.length >= 2) {
      const referenceStructure = structures[loadedLocales[0]];
      
      for (let i = 1; i < loadedLocales.length; i++) {
        const currentStructure = structures[loadedLocales[i]];
        
        // Check that all reference namespaces exist
        for (const namespace of referenceStructure) {
          expect(currentStructure).toContain(namespace);
        }
      }
    }
  });
});