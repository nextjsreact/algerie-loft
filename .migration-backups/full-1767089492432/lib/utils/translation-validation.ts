import { readFileSync } from 'fs';
import { join } from 'path';

export interface ValidationError {
  type: 'missing_key' | 'missing_interpolation' | 'invalid_format' | 'inconsistent_structure';
  locale: string;
  key: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalKeys: number;
    missingKeys: number;
    locales: string[];
  };
}

/**
 * Valide la cohérence des traductions entre les différentes locales
 */
export function validateTranslations(): ValidationResult {
  const locales = ['fr', 'ar', 'en'];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Charger tous les fichiers de traduction
  const translations: Record<string, any> = {};
  
  for (const locale of locales) {
    try {
      const filePath = join(process.cwd(), 'messages', `${locale}.json`);
      const content = readFileSync(filePath, 'utf-8');
      translations[locale] = JSON.parse(content);
    } catch (error) {
      errors.push({
        type: 'missing_key',
        locale,
        key: 'file',
        message: `Cannot load translation file for locale ${locale}`,
        suggestion: `Create messages/${locale}.json file`
      });
    }
  }
  
  // Obtenir toutes les clés de la locale de référence (français)
  const referenceKeys = getAllKeys(translations.fr || {});
  
  // Vérifier que toutes les clés existent dans toutes les locales
  for (const locale of locales) {
    if (!translations[locale]) continue;
    
    const localeKeys = getAllKeys(translations[locale]);
    
    // Clés manquantes dans cette locale
    for (const key of referenceKeys) {
      if (!hasKey(translations[locale], key)) {
        errors.push({
          type: 'missing_key',
          locale,
          key,
          message: `Missing translation for key "${key}" in locale ${locale}`,
          suggestion: `Add translation for "${key}" in messages/${locale}.json`
        });
      }
    }
    
    // Clés supplémentaires dans cette locale
    for (const key of localeKeys) {
      if (!hasKey(translations.fr, key)) {
        warnings.push({
          type: 'inconsistent_structure',
          locale,
          key,
          message: `Extra key "${key}" found in locale ${locale} but not in reference locale (fr)`,
          suggestion: `Remove key "${key}" or add it to messages/fr.json`
        });
      }
    }
  }
  
  // Vérifier les interpolations
  for (const locale of locales) {
    if (!translations[locale]) continue;
    
    for (const key of referenceKeys) {
      const referenceValue = getValueByKey(translations.fr, key);
      const localeValue = getValueByKey(translations[locale], key);
      
      if (typeof referenceValue === 'string' && typeof localeValue === 'string') {
        const referenceInterpolations = extractInterpolations(referenceValue);
        const localeInterpolations = extractInterpolations(localeValue);
        
        // Vérifier que les interpolations correspondent
        for (const interpolation of referenceInterpolations) {
          if (!localeInterpolations.includes(interpolation)) {
            errors.push({
              type: 'missing_interpolation',
              locale,
              key,
              message: `Missing interpolation "{${interpolation}}" in locale ${locale}`,
              suggestion: `Add {${interpolation}} to the translation in messages/${locale}.json`
            });
          }
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalKeys: referenceKeys.length,
      missingKeys: errors.filter(e => e.type === 'missing_key').length,
      locales
    }
  };
}

/**
 * Obtient toutes les clés d'un objet de traduction (format dot notation)
 */
function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Vérifie si une clé existe dans un objet de traduction
 */
function hasKey(obj: any, key: string): boolean {
  const keys = key.split('.');
  let current = obj;
  
  for (const k of keys) {
    if (!current || typeof current !== 'object' || !(k in current)) {
      return false;
    }
    current = current[k];
  }
  
  return true;
}

/**
 * Obtient la valeur d'une clé dans un objet de traduction
 */
function getValueByKey(obj: any, key: string): any {
  const keys = key.split('.');
  let current = obj;
  
  for (const k of keys) {
    if (!current || typeof current !== 'object' || !(k in current)) {
      return undefined;
    }
    current = current[k];
  }
  
  return current;
}

/**
 * Extrait les interpolations d'une chaîne de traduction
 * Supporte les formats : {variable}, {{variable}}, {variable, plural, ...}
 */
function extractInterpolations(text: string): string[] {
  const interpolations: string[] = [];
  
  // Format next-intl : {variable}
  const nextIntlMatches = text.match(/\{([^}]+)\}/g);
  if (nextIntlMatches) {
    for (const match of nextIntlMatches) {
      const variable = match.slice(1, -1).split(',')[0].trim();
      if (!interpolations.includes(variable)) {
        interpolations.push(variable);
      }
    }
  }
  
  // Format i18next : {{variable}}
  const i18nextMatches = text.match(/\{\{([^}]+)\}\}/g);
  if (i18nextMatches) {
    for (const match of i18nextMatches) {
      const variable = match.slice(2, -2).trim();
      if (!interpolations.includes(variable)) {
        interpolations.push(variable);
      }
    }
  }
  
  return interpolations;
}

/**
 * Génère un rapport de validation lisible
 */
export function generateValidationReport(result: ValidationResult): string {
  let report = '# Translation Validation Report\n\n';
  
  report += `## Summary\n`;
  report += `- **Status**: ${result.isValid ? '✅ Valid' : '❌ Invalid'}\n`;
  report += `- **Total Keys**: ${result.summary.totalKeys}\n`;
  report += `- **Missing Keys**: ${result.summary.missingKeys}\n`;
  report += `- **Locales**: ${result.summary.locales.join(', ')}\n`;
  report += `- **Errors**: ${result.errors.length}\n`;
  report += `- **Warnings**: ${result.warnings.length}\n\n`;
  
  if (result.errors.length > 0) {
    report += `## Errors\n\n`;
    for (const error of result.errors) {
      report += `### ${error.locale} - ${error.key}\n`;
      report += `- **Type**: ${error.type}\n`;
      report += `- **Message**: ${error.message}\n`;
      if (error.suggestion) {
        report += `- **Suggestion**: ${error.suggestion}\n`;
      }
      report += '\n';
    }
  }
  
  if (result.warnings.length > 0) {
    report += `## Warnings\n\n`;
    for (const warning of result.warnings) {
      report += `### ${warning.locale} - ${warning.key}\n`;
      report += `- **Type**: ${warning.type}\n`;
      report += `- **Message**: ${warning.message}\n`;
      if (warning.suggestion) {
        report += `- **Suggestion**: ${warning.suggestion}\n`;
      }
      report += '\n';
    }
  }
  
  return report;
}