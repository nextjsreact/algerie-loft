import { NextRequest, NextResponse } from 'next/server'
import { requireAuthAPI } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    const { id } = await params
    
    const supabase = await createClient()

    const { data: photos, error } = await supabase
      .from('loft_photos')
      .select(`
        id,
        file_name,
        file_size,
        mime_type,
        url,
        created_at,
        uploaded_by,
        uploader:profiles!uploaded_by (
          full_name,
          email
        )
      `)
      .eq('loft_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des photos' },
        { status: 500 }
      )
    }

    return NextResponse.json(photos || [])

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}