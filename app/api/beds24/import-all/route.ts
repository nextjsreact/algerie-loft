import { NextRequest, NextResponse } from 'next/server'

const BEDS24_API_KEY = process.env.BEDS24_API_KEY
// Use API v1 for better compatibility
const BEDS24_API_V1 = 'https://api.beds24.com/json'

export async function POST(request: NextRequest) {
  try {
    if (!BEDS24_API_KEY) {
      return NextResponse.json(
        { error: 'BEDS24_API_KEY not configured' },
        { status: 500 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
      created: [] as any[],
      message: '',
    }

    // For now, we'll use a simpler approach:
    // The user needs to manually create properties in Beds24 interface
    // because the API v2 doesn't have a straightforward way to:
    // 1. List unmapped Airbnb listings
    // 2. Create properties and map them to Airbnb in one go
    
    results.message = "L'import automatique via API n'est pas encore supporté par Beds24 API v2. Veuillez utiliser l'interface Beds24 pour importer vos listings."
    results.skipped = 85

    return NextResponse.json({
      success: false,
      results,
      recommendation: {
        title: "Import manuel recommandé",
        steps: [
          "1. Connectez-vous à Beds24: https://beds24.com",
          "2. Allez dans 'Channel Manager' → 'Airbnb' → 'Mapping'",
          "3. Pour chaque listing sans 'Connected Room', cliquez sur la cellule vide",
          "4. Sélectionnez 'Create new property'",
          "5. Beds24 créera automatiquement la propriété avec les infos Airbnb"
        ],
        alternative: "Ou utilisez l'option 'Import' dans le menu Properties si disponible"
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Beds24 import all error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
