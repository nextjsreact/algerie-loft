import { renderHook } from '@testing-library/react';
import { useMigrationTranslation } from '@/lib/hooks/use-migration-translation';
import { NextIntlClientProvider } from 'next-intl';
import { I18nProvider } from '@/lib/i18n/context';

// Mock des messages pour les tests
const mockMessages = {
  auth: {
    signIn: 'Se connecter',
    signUp: 'S\'inscrire'
  },
  dashboard: {
    title: 'Tableau de Bord'
  }
};

// Wrapper pour next-intl
const NextIntlWrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="fr" messages={mockMessages}>
    {children}
  </NextIntlClientProvider>
);

// Wrapper pour i18next (fallback)
const I18nextWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider lang="fr">
    {children}
  </I18nProvider>
);

// Wrapper combiné
const CombinedWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextWrapper>
    <NextIntlWrapper>
      {children}
    </NextIntlWrapper>
  </I18nextWrapper>
);

describe('useMigrationTranslation', () => {
  test('should return translation from next-intl when available', () => {
    const { result } = renderHook(
      () => useMigrationTranslation('auth'),
      { wrapper: CombinedWrapper }
    );

    expect(result.current.t('signIn')).toBe('Se connecter');
  });

  test('should check if translation exists', () => {
    const { result } = renderHook(
      () => useMigrationTranslation('auth'),
      { wrapper: CombinedWrapper }
    );

    expect(result.current.hasTranslation('signIn')).toBe(true);
    expect(result.current.hasTranslation('nonExistentKey')).toBe(false);
  });

  test('should provide raw translations for debugging', () => {
    const { result } = renderHook(
      () => useMigrationTranslation('auth'),
      { wrapper: CombinedWrapper }
    );

    const raw = result.current.getRawTranslation('signIn');
    expect(raw.nextIntl).toBe('Se connecter');
  });

  test('should handle missing namespace gracefully', () => {
    const { result } = renderHook(
      () => useMigrationTranslation(),
      { wrapper: CombinedWrapper }
    );

    // Should not throw error
    expect(() => result.current.t('someKey')).not.toThrow();
  });
});