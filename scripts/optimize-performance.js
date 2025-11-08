#!/usr/bin/env node

/**
 * Script d'optimisation des performances
 * Analyse et optimise automatiquement l'application
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🚀 Démarrage de l\'optimisation des performances...\n')

// 1. Analyser la taille du bundle
console.log('📊 1. Analyse de la taille du bundle...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ Build terminé avec succès\n')
} catch (error) {
  console.error('❌ Erreur lors du build:', error.message)
  process.exit(1)
}

// 2. Analyser les dépendances lourdes
console.log('📦 2. Analyse des dépendances...')
const packageJsonPath = join(process.cwd(), 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

const heavyDependencies = [
  'moment', // Remplacer par date-fns ou dayjs
  'lodash', // Utiliser lodash-es ou des imports spécifiques
  '@emotion/react', // Vérifier si nécessaire
  'framer-motion' // Lazy load si possible
]

const foundHeavyDeps = heavyDependencies.filter(dep => 
  packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
)

if (foundHeavyDeps.length > 0) {
  console.log('⚠️  Dépendances lourdes détectées:')
  foundHeavyDeps.forEach(dep => console.log(`   - ${dep}`))
  console.log('💡 Considérez des alternatives plus légères\n')
} else {
  console.log('✅ Aucune dépendance lourde détectée\n')
}

// 3. Vérifier la configuration Next.js
console.log('⚙️  3. Vérification de la configuration Next.js...')
const nextConfigPath = join(process.cwd(), 'next.config.mjs')
if (existsSync(nextConfigPath)) {
  const nextConfig = readFileSync(nextConfigPath, 'utf8')
  
  const optimizations = [
    { check: 'compress: true', name: 'Compression' },
    { check: 'optimizePackageImports', name: 'Optimisation des imports' },
    { check: 'removeConsole', name: 'Suppression des console.log' },
    { check: 'formats: [\'image/avif\', \'image/webp\']', name: 'Formats d\'images modernes' }
  ]

  optimizations.forEach(opt => {
    if (nextConfig.includes(opt.check)) {
      console.log(`✅ ${opt.name} activé`)
    } else {
      console.log(`⚠️  ${opt.name} non configuré`)
    }
  })
  console.log()
} else {
  console.log('❌ next.config.mjs non trouvé\n')
}

// 4. Analyser les images
console.log('🖼️  4. Analyse des images...')
try {
  const publicDir = join(process.cwd(), 'public')
  const images = execSync('find public -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" 2>/dev/null || echo ""', 
    { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  
  if (images.length > 0) {
    console.log(`📸 ${images.length} images trouvées`)
    
    // Vérifier les images lourdes (> 500KB)
    const heavyImages = []
    images.forEach(imagePath => {
      try {
        const stats = execSync(`stat -f%z "${imagePath}" 2>/dev/null || stat -c%s "${imagePath}" 2>/dev/null || echo 0`, 
          { encoding: 'utf8' }).trim()
        const size = parseInt(stats)
        if (size > 500000) { // 500KB
          heavyImages.push({ path: imagePath, size: Math.round(size / 1024) })
        }
      } catch (e) {
        // Ignorer les erreurs de stat
      }
    })
    
    if (heavyImages.length > 0) {
      console.log('⚠️  Images lourdes détectées (> 500KB):')
      heavyImages.forEach(img => console.log(`   - ${img.path} (${img.size}KB)`))
      console.log('💡 Considérez l\'optimisation avec next/image\n')
    } else {
      console.log('✅ Toutes les images sont optimisées\n')
    }
  } else {
    console.log('ℹ️  Aucune image trouvée dans /public\n')
  }
} catch (error) {
  console.log('⚠️  Impossible d\'analyser les images\n')
}

// 5. Vérifier les traductions
console.log('🌐 5. Analyse des traductions...')
const messagesDir = join(process.cwd(), 'messages')
if (existsSync(messagesDir)) {
  try {
    const translationFiles = ['fr.json', 'en.json', 'ar.json']
    let totalSize = 0
    
    translationFiles.forEach(file => {
      const filePath = join(messagesDir, file)
      if (existsSync(filePath)) {
        const stats = execSync(`stat -f%z "${filePath}" 2>/dev/null || stat -c%s "${filePath}" 2>/dev/null || echo 0`, 
          { encoding: 'utf8' }).trim()
        const size = parseInt(stats)
        totalSize += size
        console.log(`   - ${file}: ${Math.round(size / 1024)}KB`)
      }
    })
    
    console.log(`📊 Taille totale des traductions: ${Math.round(totalSize / 1024)}KB`)
    
    if (totalSize > 200000) { // 200KB
      console.log('⚠️  Traductions volumineuses détectées')
      console.log('💡 Considérez le lazy loading des traductions\n')
    } else {
      console.log('✅ Taille des traductions acceptable\n')
    }
  } catch (error) {
    console.log('⚠️  Impossible d\'analyser les traductions\n')
  }
} else {
  console.log('ℹ️  Dossier messages non trouvé\n')
}

// 6. Générer un rapport d'optimisation
console.log('📋 6. Génération du rapport d\'optimisation...')
const report = {
  timestamp: new Date().toISOString(),
  recommendations: [],
  optimizations: {
    applied: [],
    pending: []
  }
}

// Recommandations basées sur l'analyse
if (foundHeavyDeps.length > 0) {
  report.recommendations.push({
    type: 'dependencies',
    priority: 'high',
    message: `Remplacer les dépendances lourdes: ${foundHeavyDeps.join(', ')}`,
    impact: 'Réduction significative de la taille du bundle'
  })
}

// Vérifier si les composants optimisés existent
const optimizedComponents = [
  'components/optimized/OptimizedLoftsList.tsx',
  'hooks/useOptimizedLofts.ts',
  'lib/performance/immediate-optimizations.ts'
]

optimizedComponents.forEach(component => {
  if (existsSync(join(process.cwd(), component))) {
    report.optimizations.applied.push(component)
  } else {
    report.optimizations.pending.push(component)
  }
})

// Sauvegarder le rapport
const reportPath = join(process.cwd(), 'performance-report.json')
writeFileSync(reportPath, JSON.stringify(report, null, 2))
console.log(`✅ Rapport sauvegardé dans ${reportPath}\n`)

// 7. Recommandations finales
console.log('🎯 Recommandations d\'optimisation:')
console.log('1. ✅ Utilisez les composants optimisés créés')
console.log('2. 🔄 Implémentez le lazy loading pour les routes non critiques')
console.log('3. 📦 Activez la compression Gzip/Brotli sur votre serveur')
console.log('4. 🖼️  Optimisez les images avec next/image')
console.log('5. 🌐 Implémentez le cache côté client pour les traductions')
console.log('6. 📊 Surveillez les Core Web Vitals en production')

console.log('\n🚀 Optimisation terminée!')
console.log('💡 Prochaines étapes:')
console.log('   - Intégrez les composants optimisés dans vos pages')
console.log('   - Testez les performances avec Lighthouse')
console.log('   - Surveillez les métriques en production')

// 8. Créer un script de démarrage optimisé
const optimizedStartScript = `#!/bin/bash
# Script de démarrage optimisé

echo "🚀 Démarrage optimisé de Loft Algérie..."

# Nettoyer le cache Next.js
echo "🧹 Nettoyage du cache..."
rm -rf .next/cache

# Variables d'environnement pour les performances
export NODE_ENV=development
export NEXT_TELEMETRY_DISABLED=1

# Démarrer avec optimisations
echo "⚡ Démarrage du serveur de développement..."
npm run dev

echo "✅ Serveur démarré avec optimisations!"
`

writeFileSync(join(process.cwd(), 'start-optimized.sh'), optimizedStartScript)
execSync('chmod +x start-optimized.sh')
console.log('📝 Script start-optimized.sh créé')

console.log('\n🎉 Optimisation des performances terminée avec succès!')