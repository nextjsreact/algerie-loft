import { NextRequest, NextResponse } from 'next/server'

const BEDS24_API_V2 = 'https://beds24.com/api/v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inviteCode } = body

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'inviteCode is required' },
        { status: 400 }
      )
    }

    // Exchange invite code for refresh token
    const response = await fetch(`${BEDS24_API_V2}/authentication/setup?code=${inviteCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: 'Failed to exchange invite code',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      refreshToken: data.refreshToken,
      message: 'Copiez ce refresh token et remplacez BEDS24_API_KEY dans vos fichiers .env',
      instructions: [
        '1. Copiez le refreshToken ci-dessus',
        '2. Remplacez BEDS24_API_KEY dans .env.local',
        '3. Remplacez BEDS24_API_KEY dans .env.production (Vercel)',
        '4. Redéployez ou attendez le prochain déploiement',
        '5. Testez à nouveau la création de propriété'
      ],
      data,
    })

  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
