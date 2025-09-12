// Test utilities for text truncation functions

const truncateEventTitle = (title: string, maxLength: number = 25): string => {
  if (title.length <= maxLength) return title;
  
  // Try to break at word boundaries
  const truncated = title.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

const shouldTruncateTitle = (title: string, maxLength: number = 25): boolean => {
  return title.length > maxLength;
};

describe('Text Truncation Utilities', () => {
  describe('truncateEventTitle', () => {
    it('should return original title if shorter than max length', () => {
      const title = 'Short title';
      const result = truncateEventTitle(title, 25);
      expect(result).toBe('Short title');
    });

    it('should truncate at word boundary when possible', () => {
      const title = 'Maintenance - Loft Centre-ville Moderne';
      const result = truncateEventTitle(title, 25);
      expect(result).toBe('Maintenance - Loft...');
      expect(result.length).toBeLessThanOrEqual(25);
    });

    it('should truncate at character boundary when no good word break', () => {
      const title = 'MaintenanceVeryLongWordWithoutSpaces';
      const result = truncateEventTitle(title, 25);
      expect(result).toBe('MaintenanceVeryLongWordWi...');
      expect(result.length).toBeLessThanOrEqual(28); // 25 + '...'
    });

    it('should handle empty strings', () => {
      const result = truncateEventTitle('', 25);
      expect(result).toBe('');
    });

    it('should handle custom max length', () => {
      const title = 'This is a longer title';
      const result = truncateEventTitle(title, 10);
      expect(result).toBe('This is a...');
    });

    it('should handle titles exactly at max length', () => {
      const title = 'Exactly twenty-five chars';
      const result = truncateEventTitle(title, 25);
      expect(result).toBe('Exactly twenty-five chars');
    });
  });

  describe('shouldTruncateTitle', () => {
    it('should return false for short titles', () => {
      expect(shouldTruncateTitle('Short', 25)).toBe(false);
    });

    it('should return true for long titles', () => {
      expect(shouldTruncateTitle('This is a very long title that exceeds the limit', 25)).toBe(true);
    });

    it('should return false for titles exactly at max length', () => {
      expect(shouldTruncateTitle('Exactly twenty-five chars', 25)).toBe(false);
    });

    it('should work with custom max length', () => {
      expect(shouldTruncateTitle('Short title', 5)).toBe(true);
      expect(shouldTruncateTitle('Short title', 20)).toBe(false);
    });
  });

  describe('Integration tests', () => {
    it('should work together for typical calendar event titles', () => {
      const titles = [
        'Maintenance - Loft Centre-ville',
        'Rénovation - Loft Moderne Kouba',
        'Bloqué - Loft Spacieux Alger',
        'Short',
      ];

      titles.forEach(title => {
        const shouldTruncate = shouldTruncateTitle(title);
        const truncated = truncateEventTitle(title);
        
        if (shouldTruncate) {
          expect(truncated).toContain('...');
          expect(truncated.length).toBeLessThanOrEqual(28);
        } else {
          expect(truncated).toBe(title);
          expect(truncated).not.toContain('...');
        }
      });
    });
  });
});