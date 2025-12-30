import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      return NextResponse.json(
        { error: 'Missing request body' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { context } = body
    
    if (!context || !['client', 'partner', 'employee'].includes(context)) {
      return NextResponse.json(
        { error: 'Invalid context' },
        { status: 400 }
      )
    }
    
    const cookieStore = await cookies()
    
    // Créer le cookie côté serveur avec une durée de 7 jours
    cookieStore.set('login_context', context, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      sameSite: 'lax',
      httpOnly: false, // Permettre l'accès client pour debug
      secure: process.env.NODE_ENV === 'production'
    })
    
    console.log(`✅ [API] Cookie login_context=${context} créé côté serveur`)
    
    return NextResponse.json({ success: true, context })
  } catch (error) {
    console.error('[API] Erreur création cookie:', error)
    return NextResponse.json(
      { error: 'Failed to set context' },
      { status: 500 }
    )
  }
}
