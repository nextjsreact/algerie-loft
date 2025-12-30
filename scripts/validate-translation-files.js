#!/usr/bin/env node
/**
 * Translation Files Validation Script
 * Task 5.3: Valider les fichiers de traduction
 * 
 * This script validates:
 * 1. Integrity of all JSON translation files
 * 2. Absence of missing translation keys
 * 3. Date and currency formatting by locale
 * 
 * Requirements: 4.5
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const LANGUAGES = ['fr', 'en', 'ar']
const MESSAGES_DIR = path.join(__dirname, '..', 'messages')
const NAMESPACES_DIR = path.join(MESSAGES_DIR, 'namespaces')

class TranslationFilesValidator {
  constructor() {
    this.translations = {}
    this.namespaceTranslations = {}
    this.errors = []
    this.warnings = []
    this.totalFiles = 0
    this.validFiles = 0
  }

  async validate() {
    console.log('🔍 Starting translation files validation...\n')
    
    // 1. Load and validate JSON integrity
    await this.loadMainTranslationFiles()
    await this.loadNamespaceTranslationFiles()
    
    // 2. Validate missing keys
    this.validateMissingKeys()
    
    // 3. Validate date and currency formatting
    this.validateDateAndCurrencyFormatting()
    
    // 4. Generate report
    return this.generateValidationResult()
  }

  async loadMainTranslationFiles() {
    console.log('📂 Loading main translation files...')
    
    for (const lang of LANGUAGES) {
      const filePath = path.join(MESSAGES_DIR, `${lang}.json`)
      this.totalFiles++
      
      if (!fs.existsSync(filePath)) {
        this.errors.push(`❌ Missing main translation file: ${lang}.json`)
        continue
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8')
        
        // Validate JSON syntax
        const parsed = JSON.parse(content)
        this.translations[lang] = parsed
        this.validFiles++
        
        console.log(`  ✅ Loaded and validated ${lang}.json`)
      } catch (error) {
        this.errors.push(`❌ Invalid JSON in ${lang}.json: ${error.message}`)
      }
    }
    
    console.log('')
  }

  async loadNamespaceTranslationFiles() {
    console.log('📂 Loading namespace translation files...')
    
    if (!fs.existsSync(NAMESPACES_DIR)) {
      this.warnings.push(`⚠️ Namespaces directory not found: ${NAMESPACES_DIR}`)
      return
    }

    // Get all namespace directories and files
    const items = fs.readdirSync(NAMESPACES_DIR, { withFileTypes: true })
    
    // Process namespace directories
    const namespaceDirs = items.filter(item => item.isDirectory())
    for (const dir of namespaceDirs) {
      const namespaceName = dir.name
      this.namespaceTranslations[namespaceName] = {}
      
      for (const lang of LANGUAGES) {
        const filePath = path.join(NAMESPACES_DIR, namespaceName, `${lang}.json`)
        this.totalFiles++
        
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8')
            const parsed = JSON.parse(content)
            this.namespaceTranslations[namespaceName][lang] = parsed
            this.validFiles++
            console.log(`  ✅ Loaded ${namespaceName}/${lang}.json`)
          } catch (error) {
            this.errors.push(`❌ Invalid JSON in ${namespaceName}/${lang}.json: ${error.message}`)
          }
        } else {
          this.warnings.push(`⚠️ Missing namespace file: ${namespaceName}/${lang}.json`)
        }
      }
    }
    
    // Process standalone namespace files (like partner-rejected-*.json)
    const standaloneFiles = items.filter(item => item.isFile() && item.name.endsWith('.json'))
    const namespaceGroups = {}
    
    // Group files by namespace prefix
    for (const file of standaloneFiles) {
      const match = file.name.match(/^(.+)-(fr|en|ar)\.json$/)
      if (match) {
        const [, namespaceName, lang] = match
        if (!namespaceGroups[namespaceName]) {
          namespaceGroups[namespaceName] = []
        }
        namespaceGroups[namespaceName].push(lang)
      }
    }
    
    // Load grouped namespace files
    for (const [namespaceName, langs] of Object.entries(namespaceGroups)) {
      this.namespaceTranslations[namespaceName] = {}
      
      for (const lang of langs) {
        const filePath = path.join(NAMESPACES_DIR, `${namespaceName}-${lang}.json`)
        this.totalFiles++
        
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          const parsed = JSON.parse(content)
          this.namespaceTranslations[namespaceName][lang] = parsed
          this.validFiles++
          console.log(`  ✅ Loaded ${namespaceName}-${lang}.json`)
        } catch (error) {
          this.errors.push(`❌ Invalid JSON in ${namespaceName}-${lang}.json: ${error.message}`)
        }
      }
    }
    
    console.log('')
  }

  validateMissingKeys() {
    console.log('🔍 Validating missing translation keys...')
    
    // Validate main translation files
    this.validateMissingKeysInTranslations('Main translations', this.translations)
    
    // Validate namespace translations
    for (const [namespaceName, namespaceTranslations] of Object.entries(this.namespaceTranslations)) {
      this.validateMissingKeysInTranslations(`Namespace: ${namespaceName}`, namespaceTranslations)
    }
    
    console.log('  ✅ Missing keys validation complete\n')
  }

  validateMissingKeysInTranslations(context, translations) {
    // Get all unique keys from all languages
    const allKeys = new Set()
    
    for (const lang of LANGUAGES) {
      if (translations[lang]) {
        this.collectAllKeys(translations[lang], '', allKeys)
      }
    }
    
    // Check each language for missing keys
    for (const lang of LANGUAGES) {
      if (!translations[lang]) {
        continue
      }
      
      const missingKeys = []
      
      for (const key of allKeys) {
        if (!this.hasNestedKey(translations[lang], key)) {
          missingKeys.push(key)
        }
      }
      
      if (missingKeys.length > 0) {
        this.errors.push(`❌ ${context} - Missing keys in ${lang}:`)
        missingKeys.slice(0, 10).forEach(key => {
          this.errors.push(`    - ${key}`)
        })
        if (missingKeys.length > 10) {
          this.errors.push(`    ... and ${missingKeys.length - 10} more keys`)
        }
      }
    }
  }

  validateDateAndCurrencyFormatting() {
    console.log('📅 Validating date and currency formatting...')
    
    // Test date formatting for each locale
    this.validateDateFormatting()
    
    // Test currency formatting for each locale
    this.validateCurrencyFormatting()
    
    console.log('  ✅ Date and currency formatting validation complete\n')
  }

  validateDateFormatting() {
    const testDate = new Date('2024-03-15T14:30:00Z')
    
    for (const lang of LANGUAGES) {
      try {
        // Test different date formats based on i18n configuration
        const locale = this.getIntlLocale(lang)
        
        // Test short date format
        const shortDate = new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(testDate)
        
        // Test medium date format
        const mediumDate = new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }).format(testDate)
        
        // Test long date format
        const longDate = new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric'
        }).format(testDate)
        
        console.log(`  📅 ${lang.toUpperCase()} date formats:`)
        console.log(`    Short: ${shortDate}`)
        console.log(`    Medium: ${mediumDate}`)
        console.log(`    Long: ${longDate}`)
        
        // Validate that formats are different and contain expected elements
        if (shortDate === mediumDate || mediumDate === longDate) {
          this.warnings.push(`⚠️ Date formats for ${lang} are too similar`)
        }
        
        // Check for proper RTL formatting in Arabic
        if (lang === 'ar') {
          // Arabic dates should contain Arabic numerals or be properly formatted
          const hasArabicElements = /[\u0660-\u0669\u06F0-\u06F9]/.test(shortDate) || 
                                   shortDate.includes('مارس') || shortDate.includes('آذار')
          if (!hasArabicElements) {
            this.warnings.push(`⚠️ Arabic date formatting may not be properly localized: ${shortDate}`)
          }
        }
        
      } catch (error) {
        this.errors.push(`❌ Date formatting error for ${lang}: ${error.message}`)
      }
    }
  }

  validateCurrencyFormatting() {
    const testAmount = 1234.56
    
    for (const lang of LANGUAGES) {
      try {
        const locale = this.getIntlLocale(lang)
        
        // Test different currencies based on locale
        const currencies = lang === 'fr' ? ['EUR', 'DZD'] : ['USD', 'DZD']
        
        for (const currency of currencies) {
          const formatted = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(testAmount)
          
          console.log(`  💰 ${lang.toUpperCase()} ${currency}: ${formatted}`)
          
          // Validate currency formatting
          if (!formatted.includes(testAmount.toString().split('.')[0])) {
            this.warnings.push(`⚠️ Currency formatting for ${lang} ${currency} may be incorrect: ${formatted}`)
          }
          
          // Check for proper currency symbol/code placement
          if (currency === 'DZD' && !formatted.includes('DZD') && !formatted.includes('د.ج')) {
            this.warnings.push(`⚠️ DZD currency symbol missing in ${lang} formatting: ${formatted}`)
          }
        }
        
        // Test percentage formatting
        const percentage = new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(0.1234)
        
        console.log(`  📊 ${lang.toUpperCase()} percentage: ${percentage}`)
        
      } catch (error) {
        this.errors.push(`❌ Currency formatting error for ${lang}: ${error.message}`)
      }
    }
  }

  getIntlLocale(lang) {
    const localeMap = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'ar': 'ar-DZ' // Arabic (Algeria)
    }
    return localeMap[lang]
  }

  collectAllKeys(obj, prefix, keys) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          this.collectAllKeys(obj[key], fullKey, keys)
        } else {
          keys.add(fullKey)
        }
      }
    }
  }

  hasNestedKey(obj, key) {
    const parts = key.split('.')
    let current = obj
    
    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return false
      }
      current = current[part]
    }
    
    return current !== undefined && current !== null && current !== ''
  }

  generateValidationResult() {
    const totalKeys = new Set()
    
    // Count total keys from main translations
    for (const lang of LANGUAGES) {
      if (this.translations[lang]) {
        this.collectAllKeys(this.translations[lang], '', totalKeys)
      }
    }
    
    // Count missing keys
    let missingKeysCount = 0
    const missingKeyErrors = this.errors.filter(error => error.includes('Missing keys'))
    missingKeysCount = missingKeyErrors.length
    
    // Count date/currency format issues
    const dateFormatIssues = this.errors.filter(error => error.includes('Date formatting')).length +
                            this.warnings.filter(warning => warning.includes('date')).length
    
    const currencyFormatIssues = this.errors.filter(error => error.includes('Currency formatting')).length +
                                this.warnings.filter(warning => warning.includes('Currency') || warning.includes('DZD')).length

    const result = {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalFiles: this.totalFiles,
        validFiles: this.validFiles,
        totalKeys: totalKeys.size,
        missingKeys: missingKeysCount,
        dateFormatIssues,
        currencyFormatIssues
      }
    }

    // Generate console report
    this.generateConsoleReport(result)
    
    return result
  }

  generateConsoleReport(result) {
    console.log('📊 Translation Files Validation Report')
    console.log('='.repeat(50))
    
    // Summary
    console.log('\n📈 Summary:')
    console.log(`  - Total files processed: ${result.summary.totalFiles}`)
    console.log(`  - Valid files: ${result.summary.validFiles}`)
    console.log(`  - Total translation keys: ${result.summary.totalKeys}`)
    console.log(`  - Missing keys issues: ${result.summary.missingKeys}`)
    console.log(`  - Date format issues: ${result.summary.dateFormatIssues}`)
    console.log(`  - Currency format issues: ${result.summary.currencyFormatIssues}`)
    
    // Errors
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:')
      result.errors.forEach(error => console.log(error))
    }
    
    // Warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:')
      result.warnings.forEach(warning => console.log(warning))
    }
    
    // Final status
    console.log('\n' + '='.repeat(50))
    if (result.success) {
      console.log('✅ All translation files are valid!')
      console.log('✅ Task 5.3 completed successfully')
    } else {
      console.log('❌ Translation files validation failed!')
      console.log(`❌ Found ${result.errors.length} errors that need to be fixed`)
    }
  }
}

// Run validation if called directly
const validator = new TranslationFilesValidator()
validator.validate()
  .then(result => {
    process.exit(result.success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Validation failed with error:', error)
    process.exit(1)
  })

export { TranslationFilesValidator }