import { NextResponse } from 'next/server'

// Configuration pour éviter les erreurs de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ 
    message: 'Secure login endpoint',
    status: 'available',
    method: 'GET'
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Secure login endpoint',
    status: 'not_implemented',
    method: 'POST'
  }, { status: 501 })
}