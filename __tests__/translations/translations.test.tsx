import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import ar from '../../messages/ar.json';

// Helper function to get all keys from a nested object
const getKeys = (obj: any, prefix = ''): string[] => {
  let keys: string[] = [];
  for (const el in obj) {
    if (typeof obj[el] === 'object' && obj[el] !== null) {
      keys = keys.concat(getKeys(obj[el], prefix + el + '.'));
    } else {
      keys.push(prefix + el);
    }
  }
  return keys;
};

const enKeys = new Set(getKeys(en));
const frKeys = new Set(getKeys(fr));
const arKeys = new Set(getKeys(ar));

describe('Translation files', () => {
  it('should have the same keys in fr.json as in en.json', () => {
    const missingKeys = [...enKeys].filter(key => !frKeys.has(key));
    expect(missingKeys).toEqual([]);
  });

  it('should have the same keys in ar.json as in en.json', () => {
    const missingKeys = [...enKeys].filter(key => !arKeys.has(key));
    expect(missingKeys).toEqual([]);
  });

  it('should not have extra keys in fr.json compared to en.json', () => {
    const extraKeys = [...frKeys].filter(key => !enKeys.has(key));
    expect(extraKeys).toEqual([]);
  });

  it('should not have extra keys in ar.json compared to en.json', () => {
    const extraKeys = [...arKeys].filter(key => !enKeys.has(key));
    expect(extraKeys).toEqual([]);
  });
});