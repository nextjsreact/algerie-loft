#!/usr/bin/env node
/**
 * Translation Validation Script
 * Validates translation consistency across all language files
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LANGUAGES = ['en', 'fr', 'ar']
const MESSAGES_DIR = path.join(__dirname, '..', 'messages')

class TranslationValidator {
  constructor() {
    this.translations = {}
    this.errors = []
    this.warnings = []
  }

  async validate() {
    console.log('🔍 Starting translation validation...\n')
    
    // Load all translation files
    this.loadTranslations()
    
    // Run validation checks
    this.validateStructure()
    this.validateCompleteness()
    this.validateConsistency()
    
    // Report results
    this.generateReport()
  }

  loadTranslations() {
    console.log('📂 Loading translation files...')
    
    LANGUAGES.forEach(lang => {
      const filePath = path.join(MESSAGES_DIR, `${lang}.json`)
      
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing translation file: ${lang}.json`)
        return
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8')
        this.translations[lang] = JSON.parse(content)
        console.log(`  ✅ Loaded ${lang}.json`)
      } catch (error) {
        this.errors.push(`Invalid JSON in ${lang}.json: ${error.message}`)
      }
    })
    
    console.log('')
  }

  validateStructure() {
    console.log('🏗️  Validating translation structure...')
    
    const structures = {}
    
    // Get structure from each language
    Object.keys(this.translations).forEach(lang => {
      structures[lang] = this.getStructure(this.translations[lang])
    })
    
    // Compare structures
    const baseStructure = structures[LANGUAGES[0]]
    LANGUAGES.slice(1).forEach(lang => {
      const differences = this.compareStructures(baseStructure, structures[lang])
      if (differences.length > 0) {
        this.errors.push(`Structure mismatch in ${lang}.json:`)
        differences.forEach(diff => {
          this.errors.push(`  - ${diff}`)
        })
      }
    })
    
    console.log('  ✅ Structure validation complete\n')
  }

  validateCompleteness() {
    console.log('📋 Validating translation completeness...')
    
    const allKeys = new Set()
    
    // Collect all keys from all languages
    Object.values(this.translations).forEach(translation => {
      this.collectKeys(translation, '', allKeys)
    })
    
    // Check each language for missing keys
    LANGUAGES.forEach(lang => {
      const missing = []
      allKeys.forEach(key => {
        if (!this.hasKey(this.translations[lang], key)) {
          missing.push(key)
        }
      })
      
      if (missing.length > 0) {
        this.warnings.push(`Missing keys in ${lang}.json (${missing.length}):`)
        missing.slice(0, 10).forEach(key => {
          this.warnings.push(`  - ${key}`)
        })
        if (missing.length > 10) {
          this.warnings.push(`  ... and ${missing.length - 10} more`)
        }
      }
    })
    
    console.log('  ✅ Completeness validation complete\n')
  }

  validateConsistency() {
    console.log('🔄 Validating translation consistency...')
    
    // Check for common consistency issues
    this.checkEmptyValues()
    this.checkDuplicateValues()
    this.checkPlaceholderConsistency()
    
    console.log('  ✅ Consistency validation complete\n')
  }

  checkEmptyValues() {
    Object.keys(this.translations).forEach(lang => {
      const emptyKeys = []
      this.findEmptyValues(this.translations[lang], '', emptyKeys)
      
      if (emptyKeys.length > 0) {
        this.warnings.push(`Empty values in ${lang}.json:`)
        emptyKeys.forEach(key => {
          this.warnings.push(`  - ${key}`)
        })
      }
    })
  }

  checkDuplicateValues() {
    Object.keys(this.translations).forEach(lang => {
      const values = new Map()
      const duplicates = []
      
      this.collectValues(this.translations[lang], '', values)
      
      values.forEach((keys, value) => {
        if (keys.length > 1 && value.length > 3) { // Ignore short values
          duplicates.push(`"${value}" appears in: ${keys.join(', ')}`)
        }
      })
      
      if (duplicates.length > 0) {
        this.warnings.push(`Duplicate values in ${lang}.json:`)
        duplicates.slice(0, 5).forEach(dup => {
          this.warnings.push(`  - ${dup}`)
        })
      }
    })
  }

  checkPlaceholderConsistency() {
    const placeholderRegex = /\{[^}]+\}/g
    
    // Get all keys that have placeholders
    const keysWithPlaceholders = new Set()
    Object.values(this.translations).forEach(translation => {
      this.findKeysWithPlaceholders(translation, '', keysWithPlaceholders)
    })
    
    // Check consistency across languages
    keysWithPlaceholders.forEach(key => {
      const placeholders = {}
      
      LANGUAGES.forEach(lang => {
        const value = this.getValueByKey(this.translations[lang], key)
        if (value) {
          const matches = value.match(placeholderRegex) || []
          placeholders[lang] = matches.sort()
        }
      })
      
      // Compare placeholders
      const basePlaceholders = placeholders[LANGUAGES[0]]
      LANGUAGES.slice(1).forEach(lang => {
        const langPlaceholders = placeholders[lang]
        if (JSON.stringify(basePlaceholders) !== JSON.stringify(langPlaceholders)) {
          this.warnings.push(`Placeholder mismatch in key "${key}":`)
          this.warnings.push(`  - ${LANGUAGES[0]}: ${basePlaceholders?.join(', ') || 'none'}`)
          this.warnings.push(`  - ${lang}: ${langPlaceholders?.join(', ') || 'none'}`)
        }
      })
    })
  }

  generateReport() {
    console.log('📊 Validation Report')
    console.log('='.repeat(50))
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All translations are valid!')
      return
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:')
      this.errors.forEach(error => console.log(error))
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:')
      this.warnings.forEach(warning => console.log(warning))
    }
    
    console.log('\n📈 Summary:')
    console.log(`  - Languages: ${LANGUAGES.length}`)
    console.log(`  - Errors: ${this.errors.length}`)
    console.log(`  - Warnings: ${this.warnings.length}`)
    
    if (this.errors.length > 0) {
      console.log('\n❌ Validation failed!')
      process.exit(1)
    } else {
      console.log('\n✅ Validation passed with warnings')
    }
  }

  // Helper methods
  getStructure(obj, prefix = '') {
    const structure = []
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        structure.push(...this.getStructure(obj[key], fullKey))
      } else {
        structure.push(fullKey)
      }
    })
    return structure.sort()
  }

  compareStructures(struct1, struct2) {
    const differences = []
    const set1 = new Set(struct1)
    const set2 = new Set(struct2)
    
    // Keys in struct1 but not in struct2
    struct1.forEach(key => {
      if (!set2.has(key)) {
        differences.push(`Missing key: ${key}`)
      }
    })
    
    // Keys in struct2 but not in struct1
    struct2.forEach(key => {
      if (!set1.has(key)) {
        differences.push(`Extra key: ${key}`)
      }
    })
    
    return differences
  }

  collectKeys(obj, prefix, keys) {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.collectKeys(obj[key], fullKey, keys)
      } else {
        keys.add(fullKey)
      }
    })
  }

  hasKey(obj, key) {
    const parts = key.split('.')
    let current = obj
    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return false
      }
      current = current[part]
    }
    return true
  }

  findEmptyValues(obj, prefix, emptyKeys) {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.findEmptyValues(obj[key], fullKey, emptyKeys)
      } else if (!obj[key] || obj[key].toString().trim() === '') {
        emptyKeys.push(fullKey)
      }
    })
  }

  collectValues(obj, prefix, values) {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.collectValues(obj[key], fullKey, values)
      } else {
        const value = obj[key].toString()
        if (!values.has(value)) {
          values.set(value, [])
        }
        values.get(value).push(fullKey)
      }
    })
  }

  findKeysWithPlaceholders(obj, prefix, keys) {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.findKeysWithPlaceholders(obj[key], fullKey, keys)
      } else if (obj[key].toString().includes('{')) {
        keys.add(fullKey)
      }
    })
  }

  getValueByKey(obj, key) {
    const parts = key.split('.')
    let current = obj
    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return null
      }
      current = current[part]
    }
    return current
  }
}

// Run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new TranslationValidator()
  validator.validate().catch(console.error)
}

export default TranslationValidator