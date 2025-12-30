import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string; namespace?: string } }
) {
  try {
    const { locale, namespace } = params
    
    // Valider la locale
    const validLocales = ['fr', 'en', 'ar']
    if (!validLocales.includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
    }
    
    // Charger les traductions optimisées
    const filePath = path.join(process.cwd(), 'messages', `${locale}-optimized.json`)
    
    if (!fs.existsSync(filePath)) {
      // Fallback vers le fichier original
      const originalPath = path.join(process.cwd(), 'messages', `${locale}.json`)
      if (!fs.existsSync(originalPath)) {
        return NextResponse.json({ error: 'Translations not found' }, { status: 404 })
      }
      
      const content = fs.readFileSync(originalPath, 'utf8')
      const data = JSON.parse(content)
      
      // Retourner seulement le namespace demandé si spécifié
      if (namespace && data[namespace]) {
        return NextResponse.json(data[namespace])
      }
      
      return NextResponse.json(data)
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)
    
    // Retourner seulement le namespace demandé si spécifié
    if (namespace && data[namespace]) {
      return NextResponse.json(data[namespace])
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
