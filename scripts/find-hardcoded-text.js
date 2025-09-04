#!/usr/bin/env node
/**
 * Find Hardcoded Text Script
 * Scans codebase for hardcoded text that should be translated
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class HardcodedTextFinder {
  constructor() {
    this.findings = []
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /\.next/,
      /dist/,
      /build/,
      /coverage/,
      /\.md$/,
      /\.json$/,
      /\.test\./,
      /\.spec\./,
      /__tests__/
    ]
    
    // Common patterns that indicate hardcoded text
    this.textPatterns = [
      // JSX text content
      />\s*[A-Z][a-zA-Z\s]{3,}\s*</g,
      // String literals in JSX attributes
      /(?:placeholder|title|alt|aria-label)=["'][A-Z][a-zA-Z\s]{3,}["']/g,
      // Button/link text
      /(?:button|a).*?>\s*[A-Z][a-zA-Z\s]{3,}\s*</g,
      // Label text
      /label.*?>\s*[A-Z][a-zA-Z\s]{3,}\s*</g
    ]
    
    // Allowed hardcoded strings (technical terms, etc.)
    this.allowedStrings = [
      'Next.js',
      'React',
      'TypeScript',
      'JavaScript',
      'HTML',
      'CSS',
      'API',
      'URL',
      'HTTP',
      'HTTPS',
      'JSON',
      'XML',
      'UUID',
      'ID',
      'OK',
      'Error',
      'Warning',
      'Info',
      'Debug'
    ]
  }

  async scan() {
    console.log('🔍 Scanning for hardcoded text...\n')
    
    const files = this.getSourceFiles()
    
    for (const file of files) {
      this.scanFile(file)
    }
    
    this.generateReport()
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
        // Skip excluded directories
        if (!this.excludePatterns.some(pattern => pattern.test(fullPath))) {
          this.walkDirectory(fullPath, files, extensions)
        }
      } else if (extensions.some(ext => fullPath.endsWith(ext))) {
        // Skip excluded files
        if (!this.excludePatterns.some(pattern => pattern.test(fullPath))) {
          files.push(fullPath)
        }
      }
    })
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        this.scanLine(line, filePath, index + 1)
      })
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`)
    }
  }

  scanLine(line, filePath, lineNumber) {
    // Skip comments and imports
    if (line.trim().startsWith('//') || 
        line.trim().startsWith('/*') || 
        line.trim().startsWith('*') ||
        line.trim().startsWith('import') ||
        line.trim().startsWith('export')) {
      return
    }
    
    // Check for JSX text content
    const jsxTextMatches = line.match(/>\s*([A-Z][a-zA-Z\s]{3,})\s*</g)
    if (jsxTextMatches) {
      jsxTextMatches.forEach(match => {
        const text = match.replace(/[><]/g, '').trim()
        if (this.isLikelyHardcodedText(text)) {
          this.findings.push({
            file: filePath,
            line: lineNumber,
            text: text,
            context: line.trim(),
            type: 'JSX Text Content'
          })
        }
      })
    }
    
    // Check for hardcoded attributes
    const attrMatches = line.match(/(?:placeholder|title|alt|aria-label)=["']([A-Z][a-zA-Z\s]{3,})["']/g)
    if (attrMatches) {
      attrMatches.forEach(match => {
        const text = match.replace(/.*=["']([^"']+)["'].*/, '$1')
        if (this.isLikelyHardcodedText(text)) {
          this.findings.push({
            file: filePath,
            line: lineNumber,
            text: text,
            context: line.trim(),
            type: 'JSX Attribute'
          })
        }
      })
    }
    
    // Check for string literals that look like UI text
    const stringMatches = line.match(/["']([A-Z][a-zA-Z\s]{4,})["']/g)
    if (stringMatches) {
      stringMatches.forEach(match => {
        const text = match.replace(/["']/g, '')
        if (this.isLikelyHardcodedText(text) && !this.isCodeRelated(line)) {
          this.findings.push({
            file: filePath,
            line: lineNumber,
            text: text,
            context: line.trim(),
            type: 'String Literal'
          })
        }
      })
    }
  }

  isLikelyHardcodedText(text) {
    // Skip if it's an allowed technical term
    if (this.allowedStrings.includes(text)) {
      return false
    }
    
    // Skip if it looks like code (camelCase, snake_case, etc.)
    if (/^[a-z][a-zA-Z0-9]*$/.test(text) || 
        /^[A-Z_][A-Z0-9_]*$/.test(text) ||
        /_/.test(text)) {
      return false
    }
    
    // Skip if it's a single word that might be a property name
    if (text.split(' ').length === 1 && text.length < 8) {
      return false
    }
    
    // Skip URLs, emails, etc.
    if (/^https?:\/\//.test(text) || 
        /@/.test(text) ||
        /\.(com|org|net|io)/.test(text)) {
      return false
    }
    
    // Skip if it looks like a CSS class or ID
    if (/^[a-z-]+$/.test(text) || text.startsWith('.') || text.startsWith('#')) {
      return false
    }
    
    return true
  }

  isCodeRelated(line) {
    // Skip lines that look like they're defining constants, types, etc.
    return /(?:const|let|var|type|interface|enum|class)\s/.test(line) ||
           /console\.(log|error|warn|info)/.test(line) ||
           /throw new Error/.test(line) ||
           /import.*from/.test(line)
  }

  generateReport() {
    console.log('📊 Hardcoded Text Report')
    console.log('='.repeat(50))
    
    if (this.findings.length === 0) {
      console.log('🎉 No hardcoded text found!')
      return
    }
    
    // Group findings by file
    const byFile = {}
    this.findings.forEach(finding => {
      if (!byFile[finding.file]) {
        byFile[finding.file] = []
      }
      byFile[finding.file].push(finding)
    })
    
    // Sort files by number of findings (most problematic first)
    const sortedFiles = Object.keys(byFile).sort((a, b) => byFile[b].length - byFile[a].length)
    
    console.log(`\n🔍 Found ${this.findings.length} potential hardcoded text instances in ${sortedFiles.length} files:\n`)
    
    sortedFiles.forEach(file => {
      console.log(`📄 ${file} (${byFile[file].length} issues):`)
      
      byFile[file].forEach(finding => {
        console.log(`  Line ${finding.line}: ${finding.type}`)
        console.log(`    Text: "${finding.text}"`)
        console.log(`    Context: ${finding.context}`)
        console.log('')
      })
    })
    
    // Summary by type
    const byType = {}
    this.findings.forEach(finding => {
      byType[finding.type] = (byType[finding.type] || 0) + 1
    })
    
    console.log('📈 Summary by type:')
    Object.keys(byType).forEach(type => {
      console.log(`  - ${type}: ${byType[type]}`)
    })
    
    console.log('\n💡 Recommendations:')
    console.log('  1. Replace hardcoded text with translation keys')
    console.log('  2. Use useTranslations() or SafeTranslation component')
    console.log('  3. Add translation keys to all language files')
    console.log('  4. Test in all supported locales')
    
    // Exit with error code if hardcoded text found
    if (this.findings.length > 0) {
      console.log('\n❌ Hardcoded text found! Please fix before committing.')
      process.exit(1)
    }
  }
}

// Run scanner
if (import.meta.url === `file://${process.argv[1]}`) {
  const finder = new HardcodedTextFinder()
  finder.scan().catch(console.error)
}

export default HardcodedTextFinder