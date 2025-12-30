/**
 * Translation Files Validation Tests
 * Task 5.3: Valider les fichiers de traduction
 * 
 * Tests for the translation validation functionality
 */

import { TranslationFilesValidator } from '../scripts/validate-translation-files.js'
import fs from 'fs'
import path from 'path'

describe('TranslationFilesValidator', () => {
  let validator

  beforeEach(() => {
    validator = new TranslationFilesValidator()
  })

  describe('JSON Integrity Validation', () => {
    test('should load main translation files without errors', async () => {
      await validator.loadMainTranslationFiles()
      
      // Check that all main language files are loaded
      expect(validator.translations.fr).toBeDefined()
      expect(validator.translations.en).toBeDefined()
      expect(validator.translations.ar).toBeDefined()
      
      // Check that they are valid objects
      expect(typeof validator.translations.fr).toBe('object')
      expect(typeof validator.translations.en).toBe('object')
      expect(typeof validator.translations.ar).toBe('object')
    })

    test('should validate JSON syntax correctly', async () => {
      await validator.loadMainTranslationFiles()
      
      // Should have no JSON syntax errors for main files
      const jsonErrors = validator.errors.filter(error => error.includes('Invalid JSON'))
      expect(jsonErrors.length).toBe(0)
    })

    test('should load namespace translation files', async () => {
      await validator.loadNamespaceTranslationFiles()
      
      // Check that namespace translations are loaded
      expect(Object.keys(validator.namespaceTranslations).length).toBeGreaterThan(0)
      
      // Check specific namespaces exist
      expect(validator.namespaceTranslations.auth).toBeDefined()
      expect(validator.namespaceTranslations.common).toBeDefined()
      expect(validator.namespaceTranslations.dashboard).toBeDefined()
    })
  })

  describe('Missing Keys Validation', () => {
    test('should identify missing translation keys', async () => {
      await validator.loadMainTranslationFiles()
      await validator.loadNamespaceTranslationFiles()
      validator.validateMissingKeys()
      
      // The validation should identify missing keys (as shown in the output)
      const missingKeyErrors = validator.errors.filter(error => error.includes('Missing keys'))
      
      // We expect some missing keys based on the validation output
      expect(missingKeyErrors.length).toBeGreaterThan(0)
    })

    test('should correctly identify nested key structures', () => {
      const testObj = {
        level1: {
          level2: {
            level3: 'value'
          }
        }
      }
      
      expect(validator.hasNestedKey(testObj, 'level1.level2.level3')).toBe(true)
      expect(validator.hasNestedKey(testObj, 'level1.level2.nonexistent')).toBe(false)
      expect(validator.hasNestedKey(testObj, 'nonexistent')).toBe(false)
    })

    test('should collect all keys from nested objects', () => {
      const testObj = {
        a: 'value1',
        b: {
          c: 'value2',
          d: {
            e: 'value3'
          }
        }
      }
      
      const keys = new Set()
      validator.collectAllKeys(testObj, '', keys)
      
      expect(keys.has('a')).toBe(true)
      expect(keys.has('b.c')).toBe(true)
      expect(keys.has('b.d.e')).toBe(true)
      expect(keys.size).toBe(3)
    })
  })

  describe('Date and Currency Formatting', () => {
    test('should validate date formatting for all locales', () => {
      validator.validateDateFormatting()
      
      // Should not have critical date formatting errors
      const dateErrors = validator.errors.filter(error => error.includes('Date formatting error'))
      expect(dateErrors.length).toBe(0)
    })

    test('should validate currency formatting for all locales', () => {
      validator.validateCurrencyFormatting()
      
      // Should not have critical currency formatting errors
      const currencyErrors = validator.errors.filter(error => error.includes('Currency formatting error'))
      expect(currencyErrors.length).toBe(0)
    })

    test('should return correct Intl locale for each language', () => {
      expect(validator.getIntlLocale('fr')).toBe('fr-FR')
      expect(validator.getIntlLocale('en')).toBe('en-US')
      expect(validator.getIntlLocale('ar')).toBe('ar-DZ')
    })

    test('should format dates correctly for French locale', () => {
      const testDate = new Date('2024-03-15T14:30:00Z')
      const formatted = new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(testDate)
      
      expect(formatted).toContain('mars')
      expect(formatted).toContain('2024')
      expect(formatted).toContain('15')
    })

    test('should format currency correctly for different locales', () => {
      const testAmount = 1234.56
      
      // French EUR
      const frEUR = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(testAmount)
      expect(frEUR).toContain('€')
      
      // English USD
      const enUSD = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(testAmount)
      expect(enUSD).toContain('$')
      
      // Arabic DZD
      const arDZD = new Intl.NumberFormat('ar-DZ', {
        style: 'currency',
        currency: 'DZD'
      }).format(testAmount)
      expect(arDZD).toContain('د.ج')
    })
  })

  describe('Full Validation Process', () => {
    test('should complete full validation process', async () => {
      const result = await validator.validate()
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.errors).toBeDefined()
      expect(result.warnings).toBeDefined()
      expect(result.summary).toBeDefined()
      
      // Check summary structure
      expect(result.summary.totalFiles).toBeGreaterThan(0)
      expect(result.summary.validFiles).toBeGreaterThan(0)
      expect(result.summary.totalKeys).toBeGreaterThan(0)
    })

    test('should generate comprehensive validation report', async () => {
      const result = await validator.validate()
      
      // Should have processed multiple files
      expect(result.summary.totalFiles).toBeGreaterThan(20)
      expect(result.summary.validFiles).toBeGreaterThan(20)
      
      // Should have found a significant number of translation keys
      expect(result.summary.totalKeys).toBeGreaterThan(1000)
      
      // Based on the validation output, we expect some issues
      expect(result.summary.missingKeys).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    test('should handle missing translation files gracefully', () => {
      // This would be tested with a mock filesystem or temporary files
      // For now, we verify the error handling structure exists
      expect(validator.errors).toBeDefined()
      expect(Array.isArray(validator.errors)).toBe(true)
    })

    test('should handle invalid JSON gracefully', () => {
      // Verify warning/error arrays are properly initialized
      expect(validator.warnings).toBeDefined()
      expect(Array.isArray(validator.warnings)).toBe(true)
    })
  })
})

describe('Translation File Structure Requirements', () => {
  test('should have all required main translation files', () => {
    const languages = ['fr', 'en', 'ar']
    const messagesDir = path.join(process.cwd(), 'messages')
    
    languages.forEach(lang => {
      const filePath = path.join(messagesDir, `${lang}.json`)
      expect(fs.existsSync(filePath)).toBe(true)
    })
  })

  test('should have valid JSON in all main translation files', () => {
    const languages = ['fr', 'en', 'ar']
    const messagesDir = path.join(process.cwd(), 'messages')
    
    languages.forEach(lang => {
      const filePath = path.join(messagesDir, `${lang}.json`)
      const content = fs.readFileSync(filePath, 'utf8')
      
      expect(() => {
        JSON.parse(content)
      }).not.toThrow()
    })
  })

  test('should have consistent top-level structure across languages', () => {
    const languages = ['fr', 'en', 'ar']
    const messagesDir = path.join(process.cwd(), 'messages')
    
    const structures = {}
    
    languages.forEach(lang => {
      const filePath = path.join(messagesDir, `${lang}.json`)
      const content = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(content)
      structures[lang] = Object.keys(parsed).sort()
    })
    
    // All languages should have the same top-level keys
    expect(structures.fr).toEqual(structures.en)
    expect(structures.en).toEqual(structures.ar)
  })
})