// TEMPORAIREMENT DÉSACTIVÉ POUR PERMETTRE LE BUILD
// Cette route cause des erreurs "cookies called outside request scope" pendant le build
// TODO: Réactiver après avoir corrigé le problème d'initialisation Supabase

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is temporarily disabled' },
    { status: 503 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is temporarily disabled' },
    { status: 503 }
  )
}
