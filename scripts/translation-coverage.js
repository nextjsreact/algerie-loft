#!/usr/bin/env node
/**
 * Translation Coverage Script
 * Generates a coverage report for translations used in the codebase
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class TranslationCoverage {
  constructor() {
    this.translations = {}
    this.usedKeys = new Set()
    this.unusedKeys = new Set()
    this.missingKeys = new Set()
    this.coverage = {}
  }

  async generateReport() {
    console.log('📊 Generating translation coverage report...\n')
    
    // Load translation files
    this.loadTranslations()
    
    // Scan codebase for used translation keys
    this.scanCodebase()
    
    // Calculate coverage
    this.calculateCoverage()
    
    // Generate report
    this.generateHTMLReport()
    this.generateConsoleReport()
  }

  loadTranslations() {
    const languages = ['en', 'fr', 'ar']
    const messagesDir = path.join(__dirname, '..', 'messages')
    
    languages.forEach(lang => {
      const filePath = path.join(messagesDir, `${lang}.json`)
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          this.translations[lang] = JSON.parse(content)
        } catch (error) {
          console.warn(`Warning: Could not load ${lang}.json: ${error.message}`)
        }
      }
    })
  }

  scanCodebase() {
    const files = this.getSourceFiles()
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      this.extractTranslationKeys(content, file)
    })
  }

  getSourceFiles() {
    const extensions = ['.tsx', '.ts', '.jsx', '.js']
    const directories = ['app', 'components', 'lib', 'hooks', 'utils']
    const files = []
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.walkDirectory(dir, files, extensions)
      }
    })
    
    return files
  }

  walkDirectory(dir, files, extensions) {
    const items = fs.readdirSync(dir)
    
    items.forEach(item => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        if (!/(node_modules|\.git|\.next|dist|build)/.test(fullPath)) {
          this.walkDirectory(fullPath, files, extensions)
        }
      } else if (extensions.some(ext => fullPath.endsWith(ext))) {
        if (!/(\.test\.|\.spec\.|__tests__)/.test(fullPath)) {
          files.push(fullPath)
        }
      }
    })
  }

  extractTranslationKeys(content, filePath) {
    // Pattern to match useTranslations calls
    const useTranslationsPattern = /useTranslations\(['"`]([^'"`]+)['"`]\)/g
    const useSafeTranslationPattern = /useSafeTranslation\(['"`]([^'"`]+)['"`]\)/g
    
    // Pattern to match t() calls
    const tCallPattern = /\bt\(['"`]([^'"`]+)['"`]/g
    
    let match
    
    // Extract namespaces from useTranslations calls
    const namespaces = new Set()
    
    while ((match = useTranslationsPattern.exec(content)) !== null) {
      namespaces.add(match[1])
    }
    
    while ((match = useSafeTranslationPattern.exec(content)) !== null) {
      namespaces.add(match[1])
    }
    
    // Extract translation keys from t() calls
    while ((match = tCallPattern.exec(content)) !== null) {
      const key = match[1]
      
      // Try to determine the namespace from context
      namespaces.forEach(namespace => {
        const fullKey = `${namespace}.${key}`
        this.usedKeys.add(fullKey)
      })
      
      // Also add the key as-is in case it's a full path
      if (key.includes('.')) {
        this.usedKeys.add(key)
      }
    }
    
    // Extract SafeTranslation component usage
    const safeTranslationPattern = /<SafeTranslation[^>]+namespace=['"`]([^'"`]+)['"`][^>]+key=['"`]([^'"`]+)['"`]/g
    
    while ((match = safeTranslationPattern.exec(content)) !== null) {
      const namespace = match[1]
      const key = match[2]
      const fullKey = `${namespace}.${key}`
      this.usedKeys.add(fullKey)
    }
  }

  calculateCoverage() {
    const languages = Object.keys(this.translations)
    
    languages.forEach(lang => {
      const allKeys = new Set()
      this.collectAllKeys(this.translations[lang], '', allKeys)
      
      const used = new Set()
      const unused = new Set()
      const missing = new Set()
      
      // Check which translation keys are used
      allKeys.forEach(key => {
        if (this.usedKeys.has(key)) {
          used.add(key)
        } else {
          unused.add(key)
        }
      })
      
      // Check which used keys are missing
      this.usedKeys.forEach(key => {
        if (!allKeys.has(key)) {
          missing.add(key)
        }
      })
      
      this.coverage[lang] = {
        total: allKeys.size,
        used: used.size,
        unused: unused.size,
        missing: missing.size,
        usedKeys: Array.from(used),
        unusedKeys: Array.from(unused),
        missingKeys: Array.from(missing),
        percentage: allKeys.size > 0 ? Math.round((used.size / allKeys.size) * 100) : 0
      }
    })
  }

  collectAllKeys(obj, prefix, keys) {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.collectAllKeys(obj[key], fullKey, keys)
      } else {
        keys.add(fullKey)
      }
    })
  }

  generateConsoleReport() {
    console.log('📊 Translation Coverage Report')
    console.log('='.repeat(50))
    
    Object.keys(this.coverage).forEach(lang => {
      const data = this.coverage[lang]
      console.log(`\n🌐 ${lang.toUpperCase()} Coverage: ${data.percentage}%`)
      console.log(`  Total keys: ${data.total}`)
      console.log(`  Used keys: ${data.used}`)
      console.log(`  Unused keys: ${data.unused}`)
      console.log(`  Missing keys: ${data.missing}`)
      
      if (data.missingKeys.length > 0) {
        console.log(`\n  ❌ Missing keys in ${lang}:`)
        data.missingKeys.slice(0, 10).forEach(key => {
          console.log(`    - ${key}`)
        })
        if (data.missingKeys.length > 10) {
          console.log(`    ... and ${data.missingKeys.length - 10} more`)
        }
      }
      
      if (data.unusedKeys.length > 0) {
        console.log(`\n  ⚠️  Unused keys in ${lang} (first 5):`)
        data.unusedKeys.slice(0, 5).forEach(key => {
          console.log(`    - ${key}`)
        })
        if (data.unusedKeys.length > 5) {
          console.log(`    ... and ${data.unusedKeys.length - 5} more`)
        }
      }
    })
    
    // Overall statistics
    const totalUsed = this.usedKeys.size
    const avgCoverage = Object.values(this.coverage)
      .reduce((sum, data) => sum + data.percentage, 0) / Object.keys(this.coverage).length
    
    console.log('\n📈 Overall Statistics:')
    console.log(`  Languages: ${Object.keys(this.coverage).length}`)
    console.log(`  Unique keys used in code: ${totalUsed}`)
    console.log(`  Average coverage: ${Math.round(avgCoverage)}%`)
    
    if (avgCoverage < 80) {
      console.log('\n⚠️  Coverage is below 80%. Consider reviewing unused translations.')
    } else {
      console.log('\n✅ Good translation coverage!')
    }
  }

  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translation Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .stat-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; margin-top: 5px; }
        .coverage-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%); transition: width 0.3s ease; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .key-list { background: #f8f9fa; padding: 15px; border-radius: 5px; max-height: 300px; overflow-y: auto; }
        .key-item { padding: 5px 0; border-bottom: 1px solid #dee2e6; font-family: monospace; }
        .missing { color: #dc3545; }
        .unused { color: #ffc107; }
        .used { color: #28a745; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Translation Coverage Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            ${Object.keys(this.coverage).map(lang => {
              const data = this.coverage[lang]
              return `
                <div class="stat-card">
                    <div class="stat-value">${data.percentage}%</div>
                    <div class="stat-label">${lang.toUpperCase()} Coverage</div>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${data.percentage}%"></div>
                    </div>
                    <div style="font-size: 0.9em; color: #666;">
                        ${data.used}/${data.total} keys used
                    </div>
                </div>
              `
            }).join('')}
        </div>
        
        ${Object.keys(this.coverage).map(lang => {
          const data = this.coverage[lang]
          return `
            <div class="section">
                <h2>${lang.toUpperCase()} Details</h2>
                
                ${data.missingKeys.length > 0 ? `
                <h3>❌ Missing Keys (${data.missingKeys.length})</h3>
                <div class="key-list">
                    ${data.missingKeys.map(key => `<div class="key-item missing">${key}</div>`).join('')}
                </div>
                ` : ''}
                
                ${data.unusedKeys.length > 0 ? `
                <h3>⚠️ Unused Keys (${data.unusedKeys.length})</h3>
                <div class="key-list">
                    ${data.unusedKeys.slice(0, 20).map(key => `<div class="key-item unused">${key}</div>`).join('')}
                    ${data.unusedKeys.length > 20 ? `<div class="key-item">... and ${data.unusedKeys.length - 20} more</div>` : ''}
                </div>
                ` : ''}
                
                <h3>✅ Used Keys (${data.usedKeys.length})</h3>
                <div class="key-list">
                    ${data.usedKeys.slice(0, 20).map(key => `<div class="key-item used">${key}</div>`).join('')}
                    ${data.usedKeys.length > 20 ? `<div class="key-item">... and ${data.usedKeys.length - 20} more</div>` : ''}
                </div>
            </div>
          `
        }).join('')}
        
        <div class="timestamp">
            Report generated by Translation Coverage Script
        </div>
    </div>
</body>
</html>
    `
    
    const reportPath = path.join(__dirname, '..', 'translation-coverage-report.html')
    fs.writeFileSync(reportPath, html)
    console.log(`\n📄 HTML report generated: ${reportPath}`)
  }
}

// Run coverage analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  const coverage = new TranslationCoverage()
  coverage.generateReport().catch(console.error)
}

export default TranslationCoverage