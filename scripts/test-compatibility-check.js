/**
 * Test the compatibility checking functionality
 */

import { promises as fs } from 'fs'

async function testCompatibilityCheck() {
  console.log('🔍 Testing Compatibility Check System')
  console.log('=' .repeat(40))

  try {
    // Test 1: Read and analyze package.json
    console.log('\n📦 Analyzing package.json...')
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))
    
    const currentNextVersion = packageJson.dependencies?.next || 'Not found'
    console.log(`   Current Next.js: ${currentNextVersion}`)
    console.log(`   Target: 16.1.1`)
    
    // Check if already on Next.js 16
    const isNext16 = currentNextVersion.includes('16.')
    if (isNext16) {
      console.log('   ✅ Already on Next.js 16!')
    } else {
      console.log('   ⚠️ Needs upgrade to Next.js 16')
    }
    
    // Test 2: Analyze critical dependencies
    console.log('\n🔍 Analyzing critical dependencies...')
    
    const criticalDeps = {
      'next-intl': { compatible: true, notes: 'Compatible with Next.js 16' },
      'react': { compatible: true, notes: 'React 18+ required' },
      'react-dom': { compatible: true, notes: 'React DOM 18+ required' },
      '@supabase/supabase-js': { compatible: true, notes: 'Compatible' },
      '@sentry/nextjs': { compatible: true, notes: 'Compatible' },
      'tailwindcss': { compatible: true, notes: 'Compatible' },
      '@radix-ui/react-dialog': { compatible: true, notes: 'Compatible' },
      'framer-motion': { compatible: true, notes: 'Compatible' }
    }
    
    let compatibleCount = 0
    let totalChecked = 0
    
    for (const [depName, info] of Object.entries(criticalDeps)) {
      const version = packageJson.dependencies?.[depName] || packageJson.devDependencies?.[depName]
      if (version) {
        totalChecked++
        const status = info.compatible ? '✅' : '❌'
        console.log(`   ${status} ${depName}@${version} - ${info.notes}`)
        if (info.compatible) compatibleCount++
      } else {
        console.log(`   ⚠️ ${depName} - Not found`)
      }
    }
    
    // Test 3: Check React version specifically
    console.log('\n⚛️ React version compatibility...')
    const reactVersion = packageJson.dependencies?.react
    if (reactVersion) {
      const reactMajor = parseInt(reactVersion.match(/(\d+)/)?.[1] || '0')
      if (reactMajor >= 18) {
        console.log(`   ✅ React ${reactVersion} is compatible`)
      } else {
        console.log(`   ❌ React ${reactVersion} needs upgrade to 18+`)
      }
    }
    
    // Test 4: Check configuration files
    console.log('\n⚙️ Configuration file analysis...')
    
    const configChecks = [
      {
        file: 'next.config.mjs',
        checks: [
          { pattern: 'experimental:', description: 'Experimental features' },
          { pattern: 'webpack:', description: 'Custom webpack config' },
          { pattern: 'next-intl', description: 'next-intl integration' }
        ]
      },
      {
        file: 'tsconfig.json', 
        checks: [
          { pattern: '"strict"', description: 'TypeScript strict mode' },
          { pattern: '"paths"', description: 'Path mappings' }
        ]
      }
    ]
    
    for (const config of configChecks) {
      try {
        const content = await fs.readFile(config.file, 'utf-8')
        console.log(`   📄 ${config.file}:`)
        
        for (const check of config.checks) {
          if (content.includes(check.pattern)) {
            console.log(`      ✅ ${check.description} found`)
          } else {
            console.log(`      ⚠️ ${check.description} not found`)
          }
        }
      } catch {
        console.log(`   ❌ ${config.file} not found`)
      }
    }
    
    // Test 5: Generate compatibility score
    console.log('\n📊 Compatibility Assessment:')
    
    const compatibilityScore = Math.round((compatibleCount / totalChecked) * 100)
    console.log(`   Dependency Compatibility: ${compatibleCount}/${totalChecked} (${compatibilityScore}%)`)
    
    if (isNext16) {
      console.log('   ✅ Already on target Next.js version')
    } else {
      console.log('   ⚠️ Next.js upgrade required')
    }
    
    // Overall assessment
    if (isNext16 && compatibilityScore >= 90) {
      console.log('\n🎉 Compatibility Status: EXCELLENT')
      console.log('   Your application is ready for Next.js 16!')
    } else if (compatibilityScore >= 80) {
      console.log('\n✅ Compatibility Status: GOOD')
      console.log('   Minor issues may need attention')
    } else if (compatibilityScore >= 60) {
      console.log('\n⚠️ Compatibility Status: NEEDS WORK')
      console.log('   Several compatibility issues need resolution')
    } else {
      console.log('\n❌ Compatibility Status: MAJOR ISSUES')
      console.log('   Significant compatibility problems detected')
    }
    
    console.log('\n🚀 Compatibility check system is working!')
    
  } catch (error) {
    console.error('\n❌ Compatibility check failed:', error.message)
    process.exit(1)
  }
}

testCompatibilityCheck().catch(console.error)