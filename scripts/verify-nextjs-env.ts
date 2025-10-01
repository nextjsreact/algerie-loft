#!/usr/bin/env tsx
/**
 * VERIFY NEXTJS ENV
 * =================
 * Vérifier que Next.js utilise bien la bonne configuration
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

async function verifyNextjsEnv() {
  console.log('🔍 VERIFY NEXTJS ENV')
  console.log('='.repeat(60))

  try {
    const workspaceRoot = process.cwd()
    
    console.log(`📁 Workspace: ${workspaceRoot}`)

    // Vérifier les fichiers .env
    console.log('\n📋 FICHIERS .ENV DISPONIBLES:')
    
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.development.local',
      '.env.production',
      '.env.production.local'
    ]

    const foundFiles: { [key: string]: any } = {}

    for (const file of envFiles) {
      const filePath = resolve(workspaceRoot, file)
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8')
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
        
        // Extraire les variables Supabase
        const supabaseVars: { [key: string]: string } = {}
        lines.forEach(line => {
          if (line.includes('SUPABASE')) {
            const [key, ...valueParts] = line.split('=')
            const value = valueParts.join('=')
            supabaseVars[key.trim()] = value.trim()
          }
        })

        foundFiles[file] = {
          exists: true,
          lines: lines.length,
          supabaseVars
        }

        console.log(`✅ ${file} (${lines.length} variables)`)
        Object.entries(supabaseVars).forEach(([key, value]) => {
          const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value
          console.log(`   ${key}: ${displayValue}`)
        })
      } else {
        foundFiles[file] = { exists: false }
        console.log(`❌ ${file} (manquant)`)
      }
    }

    // Ordre de priorité Next.js
    console.log('\n📋 ORDRE DE PRIORITÉ NEXT.JS:')
    console.log('1. .env.development.local (NODE_ENV=development)')
    console.log('2. .env.local')
    console.log('3. .env.development (NODE_ENV=development)')
    console.log('4. .env')

    // Déterminer quel fichier Next.js utilise
    console.log('\n🎯 FICHIER UTILISÉ PAR NEXT.JS:')
    
    let activeFile = null
    let activeVars = {}

    if (process.env.NODE_ENV === 'development') {
      if (foundFiles['.env.development.local']?.exists) {
        activeFile = '.env.development.local'
        activeVars = foundFiles['.env.development.local'].supabaseVars
      } else if (foundFiles['.env.local']?.exists) {
        activeFile = '.env.local'
        activeVars = foundFiles['.env.local'].supabaseVars
      } else if (foundFiles['.env.development']?.exists) {
        activeFile = '.env.development'
        activeVars = foundFiles['.env.development'].supabaseVars
      } else if (foundFiles['.env']?.exists) {
        activeFile = '.env'
        activeVars = foundFiles['.env'].supabaseVars
      }
    } else {
      if (foundFiles['.env.local']?.exists) {
        activeFile = '.env.local'
        activeVars = foundFiles['.env.local'].supabaseVars
      } else if (foundFiles['.env']?.exists) {
        activeFile = '.env'
        activeVars = foundFiles['.env'].supabaseVars
      }
    }

    if (activeFile) {
      console.log(`✅ Fichier actif: ${activeFile}`)
      console.log('Variables Supabase actives:')
      Object.entries(activeVars).forEach(([key, value]) => {
        const displayValue = (value as string).length > 50 ? (value as string).substring(0, 50) + '...' : value
        console.log(`   ${key}: ${displayValue}`)
      })

      // Vérifier si c'est la base DEV ou PROD
      const url = (activeVars as any)['NEXT_PUBLIC_SUPABASE_URL'] || ''
      if (url.includes('wtcbyjdwjrrqyzpvjfze')) {
        console.log('🎯 BASE: DEV (wtcbyjdwjrrqyzpvjfze) ✅')
      } else if (url.includes('mhngbluefyucoesgcjoy')) {
        console.log('🎯 BASE: PROD (mhngbluefyucoesgcjoy) ⚠️')
      } else {
        console.log('🎯 BASE: INCONNUE ❌')
      }
    } else {
      console.log('❌ Aucun fichier .env trouvé')
    }

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('='.repeat(40))
    
    if (activeFile === '.env' && foundFiles['.env'].supabaseVars['NEXT_PUBLIC_SUPABASE_URL']?.includes('wtcbyjdwjrrqyzpvjfze')) {
      console.log('✅ Configuration correcte')
      console.log('✅ Next.js utilise la base DEV')
      console.log('🔄 Redémarrez le serveur Next.js si pas encore fait')
    } else if (activeFile === '.env' && foundFiles['.env'].supabaseVars['NEXT_PUBLIC_SUPABASE_URL']?.includes('mhngbluefyucoesgcjoy')) {
      console.log('⚠️ Next.js utilise encore la base PROD')
      console.log('🔧 Vérifiez que .env contient bien les variables DEV')
    } else {
      console.log('❌ Configuration problématique')
      console.log('🔧 Vérifiez les fichiers .env')
    }

    console.log('\n🚀 ÉTAPES SUIVANTES:')
    console.log('1. Vérifiez que le serveur Next.js est redémarré')
    console.log('2. Testez sur: http://localhost:3000/fr/debug-login')
    console.log('3. Cliquez sur "🌍 Vérifier ENV" pour voir les variables côté client')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

verifyNextjsEnv().catch(console.error)