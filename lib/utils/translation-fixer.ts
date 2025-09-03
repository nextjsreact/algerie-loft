import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { validateTranslations, ValidationError } from './translation-validation';

/**
 * Utilitaire pour corriger automatiquement certaines erreurs de traduction
 */
export class TranslationFixer {
  private messagesDir: string;
  
  constructor(messagesDir = 'messages') {
    this.messagesDir = messagesDir;
  }
  
  /**
   * Corrige automatiquement les clés manquantes en utilisant des fallbacks
   */
  async fixMissingKeys(dryRun = true): Promise<{
    fixed: number;
    errors: string[];
  }> {
    const result = validateTranslations();
    const missingKeyErrors = result.errors.filter(e => e.type === 'missing_key');
    
    let fixed = 0;
    const errors: string[] = [];
    
    // Grouper les erreurs par locale
    const errorsByLocale = missingKeyErrors.reduce((acc, error) => {
      if (!acc[error.locale]) acc[error.locale] = [];
      acc[error.locale].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);
    
    for (const [locale, localeErrors] of Object.entries(errorsByLocale)) {
      try {
        const filePath = join(process.cwd(), this.messagesDir, `${locale}.json`);
        const translations = JSON.parse(readFileSync(filePath, 'utf-8'));
        
        for (const error of localeErrors) {
          const fallbackValue = this.getFallbackValue(error.key, locale);
          if (fallbackValue) {
            this.setNestedValue(translations, error.key, fallbackValue);
            fixed++;
            console.log(`✅ Fixed ${locale}.${error.key} = "${fallbackValue}"`);
          } else {
            errors.push(`Cannot find fallback for ${locale}.${error.key}`);
          }
        }
        
        if (!dryRun) {
          writeFileSync(filePath, JSON.stringify(translations, null, 2));
        }
        
      } catch (error) {
        errors.push(`Error processing ${locale}: ${error}`);
      }
    }
    
    return { fixed, errors };
  }
  
  /**
   * Obtient une valeur de fallback pour une clé manquante
   */
  private getFallbackValue(key: string, targetLocale: string): string | null {
    // Essayer d'abord le français comme référence
    if (targetLocale !== 'fr') {
      const frValue = this.getValueFromLocale(key, 'fr');
      if (frValue) return frValue;
    }
    
    // Ensuite l'anglais
    if (targetLocale !== 'en') {
      const enValue = this.getValueFromLocale(key, 'en');
      if (enValue) return enValue;
    }
    
    // Enfin l'arabe
    if (targetLocale !== 'ar') {
      const arValue = this.getValueFromLocale(key, 'ar');
      if (arValue) return arValue;
    }
    
    // Fallback générique basé sur la clé
    return this.generateFallbackFromKey(key, targetLocale);
  }
  
  /**
   * Obtient une valeur depuis une locale spécifique
   */
  private getValueFromLocale(key: string, locale: string): string | null {
    try {
      const filePath = join(process.cwd(), this.messagesDir, `${locale}.json`);
      const translations = JSON.parse(readFileSync(filePath, 'utf-8'));
      return this.getNestedValue(translations, key);
    } catch {
      return null;
    }
  }
  
  /**
   * Génère un fallback basé sur la clé
   */
  private generateFallbackFromKey(key: string, locale: string): string {
    const lastPart = key.split('.').pop() || key;
    
    // Convertir camelCase en mots
    const words = lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    // Ajouter un préfixe selon la locale pour indiquer que c'est un fallback
    const prefix = {
      'fr': '[FR]',
      'en': '[EN]',
      'ar': '[AR]'
    }[locale] || '[??]';
    
    return `${prefix} ${words}`;
  }
  
  /**
   * Obtient une valeur imbriquée d'un objet
   */
  private getNestedValue(obj: any, key: string): string | null {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (!current || typeof current !== 'object' || !(k in current)) {
        return null;
      }
      current = current[k];
    }
    
    return typeof current === 'string' ? current : null;
  }
  
  /**
   * Définit une valeur imbriquée dans un objet
   */
  private setNestedValue(obj: any, key: string, value: string): void {
    const keys = key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  }
}