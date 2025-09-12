"use client";

import { useTranslation as useBaseTranslation } from '../context';
import { translationValidator } from '../validator';
import { Language } from '../translations';

interface UseTranslationOptions {
  validate?: boolean;
  namespace?: string;
  fallbackLanguage?: Language;
}

export function useTranslation(
  namespaces?: string | string[],
  options: UseTranslationOptions = {}
) {
  const { t: baseT, i18n: baseI18n, ready } = useBaseTranslation(namespaces);
  
  const { validate = false, namespace, fallbackLanguage = 'ar' } = options;

  // Enhanced translation function with validation and fallback
  const enhancedT = (key: string, options?: any): string => {
    try {
      console.log(`🔍 Translating key: "${key}" for language: "${baseI18n.language}"`);
      
      // Try translation with namespace prefix
      const translation = baseT(key, options);
      console.log(`🔍 Base translation result: "${translation}" (type: ${typeof translation})`);
      
      if (typeof translation === 'string' && translation !== key) {
        console.log(`✅ Found translation: "${translation}"`);
        return translation;
      }

      // Handle nested keys (e.g., "calendar.title")
      if (key.includes('.')) {
        const parts = key.split('.');
        const namespaceStr = Array.isArray(namespaces) ? namespaces[0] : namespaces || 'common';
        console.log(`🔍 Looking for nested key "${key}" in namespace "${namespaceStr}"`);
        
        let current: any = baseI18n.getResourceBundle(baseI18n.language, namespaceStr) || {};
        console.log(`🔍 Resource bundle for "${namespaceStr}":`, Object.keys(current));
        
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
            console.log(`🔍 Navigated to: "${part}", value:`, current);
          } else {
            console.log(`❌ Key part "${part}" not found in object`);
            current = null;
            break;
          }
        }
        
        if (typeof current === 'string') {
          console.log(`✅ Found nested translation: "${current}"`);
          return current;
        }
      }

      // Final fallback to default language
      if (fallbackLanguage && baseI18n.language !== fallbackLanguage) {
        const namespaceStr = Array.isArray(namespaces) ? namespaces[0] : namespaces || 'common';
        console.log(`🔍 Trying fallback to "${fallbackLanguage}" for key "${key}"`);
        
        const resourceBundle = baseI18n.getResourceBundle(fallbackLanguage, namespaceStr) as Record<string, any> || {};
        
        // Try nested key access in fallback language
        if (key.includes('.')) {
          const parts = key.split('.');
          let current: any = resourceBundle;
          
          for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
              current = current[part];
            } else {
              current = null;
              break;
            }
          }
          
          if (typeof current === 'string') {
            console.warn(`⚠️ Translation key "${key}" not found for language "${baseI18n.language}", using fallback "${fallbackLanguage}": "${current}"`);
            return current;
          }
        }
      }

      console.warn(`❌ Translation key "${key}" not found for language "${baseI18n.language}"`);
      return key; // Return key as last resort
    } catch (error) {
      console.error(`❌ Error translating key "${key}":`, error);
      return key;
    }
  };

  // Validation function
  const validateTranslations = (expectedKeys: string[]) => {
    if (!validate || !namespace) return { valid: true, missing: [] };

    const currentLanguage = baseI18n.language as Language;
    const translations = baseI18n.getResourceBundle(currentLanguage, namespace) || {};
    
    return translationValidator.validateTranslationKeys(
      translations,
      expectedKeys,
      namespace,
      currentLanguage
    );
  };

  // Change language with validation
  const changeLanguage = async (lng: Language): Promise<void> => {
    try {
      await baseI18n.changeLanguage(lng);
      if (validate && namespace) {
        const expectedKeys = getExpectedKeysForNamespace(namespace);
        validateTranslations(expectedKeys);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  };

  // Get expected keys for a namespace (you can implement this based on your needs)
  const getExpectedKeysForNamespace = (namespace: string): string[] => {
    // This could be implemented to return expected keys for each namespace
    // For now, return empty array
    return [];
  };

  return {
    t: enhancedT,
    i18n: baseI18n,
    ready,
    changeLanguage,
    validateTranslations,
    language: baseI18n.language,
  };
}