#!/usr/bin/env node

/**
 * Script de correction rapide des performances
 * Applique les optimisations les plus critiques en quelques minutes
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🚀 Application des optimisations de performance critiques...\n')

const fixes = []

// 1. Vérifier et optimiser next.config.mjs
console.log('⚙️  1. Optimisation de next.config.mjs...')
const nextConfigPath = join(process.cwd(), 'next.config.mjs')

if (existsSync(nextConfigPath)) {
  let nextConfig = readFileSync(nextConfigPath, 'utf8')
  let modified = false

  // Ajouter la compression si manquante
  if (!nextConfig.includes('compress: true')) {
    nextConfig = nextConfig.replace(
      'const nextConfig = {',
      `const nextConfig = {
  // Compression pour de meilleures performances
  compress: true,`
    )
    modified = true
    fixes.push('✅ Compression activée')
  }

  // Ajouter l'optimisation des images si manquante
  if (!nextConfig.includes('formats: [\'image/avif\', \'image/webp\']')) {
    const imageOptimization = `
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 an de cache`
    
    if (nextConfig.includes('images: {')) {
      nextConfig = nextConfig.replace(
        'images: {',
        `images: {${imageOptimization},`
      )
    } else {
      nextConfig = nextConfig.replace(
        'const nextConfig = {',
        `const nextConfig = {
  images: {${imageOptimization}
  },`
      )
    }
    modified = true
    fixes.push('✅ Optimisation des images activée')
  }

  // Ajouter la suppression des console.log en production
  if (!nextConfig.includes('removeConsole')) {
    const compilerOptimization = `
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },`
    
    nextConfig = nextConfig.replace(
      'const nextConfig = {',
      `const nextConfig = {${compilerOptimization}`
    )
    modified = true
    fixes.push('✅ Suppression des console.log en production')
  }

  if (modified) {
    writeFileSync(nextConfigPath, nextConfig)
    console.log('✅ next.config.mjs optimisé')
  } else {
    console.log('ℹ️  next.config.mjs déjà optimisé')
  }
} else {
  console.log('❌ next.config.mjs non trouvé')
}

// 2. Créer un composant Image optimisé simple
console.log('\n🖼️  2. Création du composant Image optimisé...')
const optimizedImagePath = join(process.cwd(), 'components/ui/FastImage.tsx')

if (!existsSync(optimizedImagePath)) {
  const optimizedImageContent = `'use client'

import Image from 'next/image'
import { useState } from 'react'

interface FastImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
}

export function FastImage({ src, alt, width, height, priority = false, className }: FastImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div 
        className={\`bg-gray-200 flex items-center justify-center \${className}\`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image non disponible</span>
      </div>
    )
  }

  return (
    <div className={\`relative overflow-hidden \${className}\`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        className={\`transition-opacity duration-300 \${isLoading ? 'opacity-0' : 'opacity-100'}\`}
      />
    </div>
  )
}

export default FastImage`

  writeFileSync(optimizedImagePath, optimizedImageContent)
  fixes.push('✅ Composant FastImage créé')
  console.log('✅ FastImage créé dans components/ui/FastImage.tsx')
} else {
  console.log('ℹ️  FastImage existe déjà')
}

// 3. Créer un hook de debounce simple
console.log('\n⏱️  3. Création du hook de debounce...')
const debounceHookPath = join(process.cwd(), 'hooks/useDebounce.ts')

if (!existsSync(debounceHookPath)) {
  const debounceHookContent = `import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce`

  writeFileSync(debounceHookPath, debounceHookContent)
  fixes.push('✅ Hook useDebounce créé')
  console.log('✅ useDebounce créé dans hooks/useDebounce.ts')
} else {
  console.log('ℹ️  useDebounce existe déjà')
}

// 4. Créer un composant de chargement optimisé
console.log('\n⏳ 4. Création du composant de chargement...')
const loadingPath = join(process.cwd(), 'components/ui/FastLoading.tsx')

if (!existsSync(loadingPath)) {
  const loadingContent = `export function FastLoading({ className = "" }: { className?: string }) {
  return (
    <div className={\`animate-pulse \${className}\`}>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-2/3"></div>
    </div>
  )
}

export function FastCardLoading() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
      <div className="bg-gray-200 rounded h-6 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-2/3"></div>
    </div>
  )
}

export default FastLoading`

  writeFileSync(loadingPath, loadingContent)
  fixes.push('✅ Composants de chargement créés')
  console.log('✅ FastLoading créé dans components/ui/FastLoading.tsx')
} else {
  console.log('ℹ️  FastLoading existe déjà')
}

// 5. Optimiser le package.json avec des scripts de performance
console.log('\n📦 5. Ajout des scripts de performance...')
const packageJsonPath = join(process.cwd(), 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

const performanceScripts = {
  "dev:fast": "next dev --turbo",
  "build:analyze": "ANALYZE=true npm run build",
  "perf:check": "npm run build && npm run start &",
  "cache:clear": "rm -rf .next/cache && npm run dev"
}

let scriptsAdded = 0
Object.entries(performanceScripts).forEach(([key, value]) => {
  if (!packageJson.scripts[key]) {
    packageJson.scripts[key] = value
    scriptsAdded++
  }
})

if (scriptsAdded > 0) {
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  fixes.push(`✅ ${scriptsAdded} scripts de performance ajoutés`)
  console.log(`✅ ${scriptsAdded} scripts de performance ajoutés`)
} else {
  console.log('ℹ️  Scripts de performance déjà présents')
}

// 6. Créer un fichier de configuration de cache
console.log('\n💾 6. Configuration du cache...')
const cacheConfigPath = join(process.cwd(), 'lib/cache-config.ts')

if (!existsSync(cacheConfigPath)) {
  const cacheConfigContent = `// Configuration du cache pour de meilleures performances
export const CACHE_CONFIG = {
  // Durées de cache (en millisecondes)
  DURATIONS: {
    SHORT: 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes  
    LONG: 30 * 60 * 1000,  // 30 minutes
    VERY_LONG: 24 * 60 * 60 * 1000 // 24 heures
  },
  
  // Clés de cache
  KEYS: {
    LOFTS_LIST: 'lofts:list',
    LOFT_DETAIL: 'loft:detail',
    USER_PROFILE: 'user:profile',
    TRANSLATIONS: 'translations'
  }
}

// Cache simple avec localStorage
export class SimpleCache {
  static set(key: string, data: any, ttl: number = CACHE_CONFIG.DURATIONS.MEDIUM) {
    if (typeof window === 'undefined') return
    
    const item = {
      data,
      expiry: Date.now() + ttl
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn('Cache storage failed:', error)
    }
  }
  
  static get(key: string) {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const parsed = JSON.parse(item)
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(key)
        return null
      }
      
      return parsed.data
    } catch (error) {
      localStorage.removeItem(key)
      return null
    }
  }
  
  static clear() {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }
}

export default SimpleCache`

  writeFileSync(cacheConfigPath, cacheConfigContent)
  fixes.push('✅ Configuration de cache créée')
  console.log('✅ Configuration de cache créée')
} else {
  console.log('ℹ️  Configuration de cache existe déjà')
}

// 7. Résumé des optimisations
console.log('\n📊 Résumé des optimisations appliquées:')
fixes.forEach(fix => console.log(`  ${fix}`))

console.log('\n🎯 Prochaines étapes pour utiliser ces optimisations:')
console.log('1. Remplacez vos <img> par <FastImage>')
console.log('2. Utilisez useDebounce pour les champs de recherche')
console.log('3. Utilisez FastLoading pour les états de chargement')
console.log('4. Utilisez SimpleCache pour mettre en cache vos données')
console.log('5. Lancez "npm run dev:fast" pour un développement plus rapide')

console.log('\n📝 Exemples d\'utilisation:')
console.log(`
// 1. Image optimisée
import FastImage from '@/components/ui/FastImage'
<FastImage src="/loft.jpg" alt="Loft" width={400} height={300} priority />

// 2. Recherche avec debounce  
import useDebounce from '@/hooks/useDebounce'
const debouncedSearch = useDebounce(searchTerm, 300)

// 3. Chargement
import { FastCardLoading } from '@/components/ui/FastLoading'
{loading ? <FastCardLoading /> : <LoftCard />}

// 4. Cache
import SimpleCache from '@/lib/cache-config'
SimpleCache.set('lofts', data, CACHE_CONFIG.DURATIONS.MEDIUM)
const cachedData = SimpleCache.get('lofts')
`)

console.log('\n🚀 Optimisations critiques appliquées avec succès!')
console.log('💡 Redémarrez votre serveur de développement pour voir les améliorations')

// Créer un fichier de suivi
const trackingData = {
  timestamp: new Date().toISOString(),
  fixes: fixes,
  nextSteps: [
    'Remplacer les images par FastImage',
    'Ajouter useDebounce aux recherches',
    'Utiliser FastLoading',
    'Implémenter SimpleCache',
    'Tester les performances'
  ]
}

writeFileSync(
  join(process.cwd(), 'performance-fixes-applied.json'), 
  JSON.stringify(trackingData, null, 2)
)

console.log('📄 Rapport sauvegardé dans performance-fixes-applied.json')