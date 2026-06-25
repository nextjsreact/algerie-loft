import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    if (!path || path.length === 0) {
      return new NextResponse('Missing path', { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return new NextResponse('Supabase URL not configured', { status: 500 })
    }

    const imagePath = path.join('/')
    const storageUrl = `${supabaseUrl}/storage/v1/object/public/loft-photos/${imagePath}`

    const response = await fetch(storageUrl, {
      headers: { 'Cache-Control': 'no-cache' },
    })

    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const blob = await response.blob()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('[photos proxy]', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
