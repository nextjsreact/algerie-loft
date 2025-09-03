#!/usr/bin/env tsx

/**
 * Translation Validation Utility
 * 
 * This script scans the codebase for translation usage and validates:
 * 1. All translation keys used in components exist in translation files
 * 2. All translation files have consistent key structures
 * 3. Missing translations across different locales
 * 
 * Usage: npm run validate:translations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration
const LOCALES = ['en', 'fr', 'ar'];
const MESSAGES_DIR = path.join(rootDir, 'messages');
const SCAN_PATTERNS = [
  'app/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}'
];

// Translation key extraction patterns
const TRANSLATION_PATTERNS = [
  // useTranslations hook: t('key') or t("key")
  /t\(['"`]([^'"`]+)['"`]\)/g,
  // useTranslations with namespace: t('namespace.key')
  /t\(['"`]([^'"`]+\.[^'"`]+)['"`]\)/g,
  // Direct translation calls with parameters
  /t\(['"`]([^'"`]+)['"`]\s*,\s*\{[^}]*\}/g
];

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    translationFiles: number;
    totalLocales: number;
    usedKeys: number;
  };
}

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

class TranslationValidator {
  private translations: Record<string, TranslationObject> = {};
  private usedKeys = new Set<string>();
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Load all translation files
   */
  async loadTranslations(): Promise<void> {
    console.log('📚 Loading translation files...');
    
    for (const locale of LOCALES) {
      const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
      
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Translation file missing: ${filePath}`);
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.translations[locale] = JSON.parse(content);
        console.log(`  ✅ Loaded ${locale}.json`);
      } catch (error) {
        this.errors.push(`Failed to parse ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Recursively get all keys from a nested object
   */
  private getNestedKeys(obj: TranslationObject, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.getNestedKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Scan source files for translation usage
   */
  async scanSourceFiles(): Promise<void> {
    console.log('🔍 Scanning source files for translation usage...');
    
    const files = await glob(SCAN_PATTERNS, { cwd: rootDir });
    
    for (const file of files) {
      const filePath = path.join(rootDir, file);
      
      if (!fs.existsSync(filePath)) continue;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Skip files that don't use translations
      if (!content.includes('useTranslations') && !content.includes("t('") && !content.includes('t("')) {
        continue;
      }

      this.extractTranslationKeys(content, file);
    }

    console.log(`  📊 Found ${this.usedKeys.size} unique translation keys in ${files.length} files`);
  }

  /**
   * Extract translation keys from file content
   */
  private extractTranslationKeys(content: string, filename: string): void {
    // Extract namespace from useTranslations calls
    const namespaceMatches = content.match(/useTranslations\(['"`]([^'"`]*)['"`]\)/g);
    const namespaces = namespaceMatches ? 
      namespaceMatches.map(match => {
        const result = match.match(/useTranslations\(['"`]([^'"`]*)['"`]\)/);
        return result ? result[1] : '';
      }) : 
      [''];

    // Extract translation key usage
    for (const pattern of TRANSLATION_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        
        // For each namespace, create the full key path
        for (const namespace of namespaces) {
          const fullKey = namespace ? `${namespace}.${key}` : key;
          this.usedKeys.add(fullKey);
        }
      }
    }
  }

  /**
   * Validate that all used keys exist in translation files
   */
  validateUsedKeys(): void {
    console.log('✅ Validating translation key usage...');
    
    const missingKeys: Record<string, string[]> = {};
    
    for (const locale of LOCALES) {
      if (!this.translations[locale]) continue;
      
      const availableKeys = this.getNestedKeys(this.translations[locale]);
      const availableKeySet = new Set(availableKeys);
      
      missingKeys[locale] = [];
      
      for (const usedKey of this.usedKeys) {
        if (!availableKeySet.has(usedKey)) {
          missingKeys[locale].push(usedKey);
        }
      }
    }

    // Report missing keys
    for (const [locale, missing] of Object.entries(missingKeys)) {
      if (missing.length > 0) {
        this.errors.push(`Missing keys in ${locale}.json: ${missing.join(', ')}`);
      }
    }
  }

  /**
   * Check for consistency across translation files
   */
  validateConsistency(): void {
    console.log('🔄 Checking translation consistency across locales...');
    
    if (LOCALES.length < 2) return;

    const keysByLocale: Record<string, Set<string>> = {};
    
    // Get all keys for each locale
    for (const locale of LOCALES) {
      if (this.translations[locale]) {
        keysByLocale[locale] = new Set(this.getNestedKeys(this.translations[locale]));
      }
    }

    // Compare keys between locales
    const baseLocale = LOCALES[0];
    const baseKeys = keysByLocale[baseLocale];
    
    if (!baseKeys) return;

    for (let i = 1; i < LOCALES.length; i++) {
      const locale = LOCALES[i];
      const localeKeys = keysByLocale[locale];
      
      if (!localeKeys) continue;

      // Keys missing in current locale
      const missingInLocale = [...baseKeys].filter(key => !localeKeys.has(key));
      if (missingInLocale.length > 0) {
        this.warnings.push(`Keys missing in ${locale}.json (present in ${baseLocale}.json): ${missingInLocale.slice(0, 10).join(', ')}${missingInLocale.length > 10 ? ` and ${missingInLocale.length - 10} more` : ''}`);
      }

      // Extra keys in current locale
      const extraInLocale = [...localeKeys].filter(key => !baseKeys.has(key));
      if (extraInLocale.length > 0) {
        this.warnings.push(`Extra keys in ${locale}.json (not in ${baseLocale}.json): ${extraInLocale.slice(0, 10).join(', ')}${extraInLocale.length > 10 ? ` and ${extraInLocale.length - 10} more` : ''}`);
      }
    }
  }

  /**
   * Generate validation report
   */
  generateReport(): ValidationResult {
    console.log('\n📋 Translation Validation Report');
    console.log('================================');
    
    console.log(`\n📊 Statistics:`);
    console.log(`  • Translation files: ${Object.keys(this.translations).length}/${LOCALES.length}`);
    console.log(`  • Unique translation keys used: ${this.usedKeys.size}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All translations are valid! No issues found.');
    }

    console.log('\n' + '='.repeat(50));
    
    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      stats: {
        translationFiles: Object.keys(this.translations).length,
        totalLocales: LOCALES.length,
        usedKeys: this.usedKeys.size
      }
    };
  }

  /**
   * Run complete validation
   */
  async validate(): Promise<ValidationResult> {
    console.log('🚀 Starting translation validation...\n');
    
    await this.loadTranslations();
    await this.scanSourceFiles();
    this.validateUsedKeys();
    this.validateConsistency();
    
    return this.generateReport();
  }
}

// Run validation if called directly
async function main() {
  const validator = new TranslationValidator();
  
  try {
    const result = await validator.validate();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Execute main function
main();

export default TranslationValidator;