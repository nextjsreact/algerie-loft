import { Language, TranslationKeys } from './translations';

export class TranslationValidator {
  private static instance: TranslationValidator;
  private missingKeys: Map<string, string[]> = new Map();

  static getInstance(): TranslationValidator {
    if (!TranslationValidator.instance) {
      TranslationValidator.instance = new TranslationValidator();
    }
    return TranslationValidator.instance;
  }

  validateTranslationKeys(
    translations: Record<string, any>,
    expectedKeys: string[],
    namespace: string,
    language: Language
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    for (const key of expectedKeys) {
      if (!this.hasNestedKey(translations, key)) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      this.missingKeys.set(`${namespace}:${language}`, missing);
      console.warn(`Missing translation keys for ${namespace}:${language}:`, missing);
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  private hasNestedKey(obj: Record<string, any>, key: string): boolean {
    return key.split('.').reduce((current: any, keyPart: string) => {
      return current && current[keyPart] !== undefined ? current[keyPart] : undefined;
    }, obj) !== undefined;
  }

  getMissingKeys(): Map<string, string[]> {
    return new Map(this.missingKeys);
  }

  clearMissingKeys(): void {
    this.missingKeys.clear();
  }
}

export const translationValidator = TranslationValidator.getInstance();