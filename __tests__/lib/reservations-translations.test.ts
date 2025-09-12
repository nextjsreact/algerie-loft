import {
  getBlockedReasonKey,
  formatBlockedEventTitle,
  getSafeEventTitle,
  getReservationTranslation
} from '@/lib/reservations-translations';

describe('Reservations Translations Utilities', () => {
  describe('getBlockedReasonKey', () => {
    it('should return correct key for maintenance', () => {
      expect(getBlockedReasonKey('maintenance')).toBe('maintenance');
      expect(getBlockedReasonKey('Maintenance')).toBe('maintenance');
      expect(getBlockedReasonKey('MAINTENANCE')).toBe('maintenance');
    });

    it('should return correct key for renovation', () => {
      expect(getBlockedReasonKey('renovation')).toBe('renovation');
      expect(getBlockedReasonKey('rénovation')).toBe('renovation');
      expect(getBlockedReasonKey('تجديد')).toBe('renovation');
    });

    it('should return correct key for personal use', () => {
      expect(getBlockedReasonKey('personal')).toBe('personal');
      expect(getBlockedReasonKey('personal_use')).toBe('personal'); // Added this test
      expect(getBlockedReasonKey('usage personnel')).toBe('personal');
      expect(getBlockedReasonKey('personal use')).toBe('personal');
      expect(getBlockedReasonKey('استخدام شخصي')).toBe('personal');
    });

    it('should return correct key for blocked', () => {
      expect(getBlockedReasonKey('blocked')).toBe('blocked');
      expect(getBlockedReasonKey('bloqué')).toBe('blocked');
      expect(getBlockedReasonKey('محظور')).toBe('blocked');
    });

    it('should return "other" for unknown reasons', () => {
      expect(getBlockedReasonKey('unknown reason')).toBe('other');
      expect(getBlockedReasonKey('custom block')).toBe('other');
    });

    it('should return "blocked" for empty or null reasons', () => {
      expect(getBlockedReasonKey('')).toBe('blocked');
      expect(getBlockedReasonKey('   ')).toBe('blocked');
    });
  });

  describe('formatBlockedEventTitle', () => {
    const mockGetTranslation = (key: string) => {
      const translations: Record<string, string> = {
        'reservations.availability.maintenance': 'Maintenance',
        'reservations.availability.renovation': 'Rénovation',
        'reservations.availability.blocked': 'Bloqué',
        'reservations.availability.other': 'Autre raison'
      };
      return translations[key] || key;
    };

    it('should format maintenance event correctly', () => {
      const result = formatBlockedEventTitle(
        'maintenance',
        'Loft Centre-ville',
        'fr',
        mockGetTranslation
      );
      expect(result).toBe('Maintenance - Loft Centre-ville');
    });

    it('should format renovation event correctly', () => {
      const result = formatBlockedEventTitle(
        'renovation',
        'Loft Moderne',
        'fr',
        mockGetTranslation
      );
      expect(result).toBe('Rénovation - Loft Moderne');
    });

    it('should handle unknown reasons', () => {
      const result = formatBlockedEventTitle(
        'custom reason',
        'Loft Test',
        'fr',
        mockGetTranslation
      );
      expect(result).toBe('Autre raison - Loft Test');
    });
  });

  describe('getSafeEventTitle', () => {
    const mockGetTranslation = (key: string) => {
      const translations: Record<string, string> = {
        'reservations.availability.maintenance': 'Maintenance',
        'reservations.availability.blocked': 'Bloqué'
      };
      return translations[key] || key;
    };

    it('should handle missing loft name with fallback', () => {
      const result = getSafeEventTitle(
        'maintenance',
        undefined,
        'loft-123-456-789',
        'fr',
        mockGetTranslation
      );
      expect(result).toBe('Maintenance - Loft 789');
    });

    it('should handle missing blocked reason with fallback', () => {
      const result = getSafeEventTitle(
        undefined,
        'Loft Test',
        'loft-123',
        'fr',
        mockGetTranslation
      );
      expect(result).toBe('Bloqué - Loft Test');
    });

    it('should handle both missing values with fallbacks', () => {
      const result = getSafeEventTitle(
        undefined,
        undefined,
        'loft-abcd-efgh',
        'fr',
        mockGetTranslation
      );
      expect(result).toBe('Bloqué - Loft efgh');
    });

    it('should work normally with all values present', () => {
      const result = getSafeEventTitle(
        'maintenance',
        'Loft Centre-ville',
        'loft-123',
        'fr',
        mockGetTranslation
      );
      expect(result).toBe('Maintenance - Loft Centre-ville');
    });
  });

  describe('Integration with getReservationTranslation', () => {
    it('should work with real translation function', () => {
      const result = getSafeEventTitle(
        'maintenance',
        'Loft Test',
        'loft-123',
        'fr',
        (key: string) => getReservationTranslation(key, 'fr')
      );
      expect(result).toBe('Maintenance - Loft Test');
    });

    it('should work with English translations', () => {
      const result = getSafeEventTitle(
        'renovation',
        'Modern Loft',
        'loft-456',
        'en',
        (key: string) => getReservationTranslation(key, 'en')
      );
      expect(result).toBe('Renovation - Modern Loft');
    });

    it('should work with Arabic translations', () => {
      const result = getSafeEventTitle(
        'maintenance',
        'لوفت حديث',
        'loft-789',
        'ar',
        (key: string) => getReservationTranslation(key, 'ar')
      );
      expect(result).toBe('صيانة - لوفت حديث');
    });
  });
});