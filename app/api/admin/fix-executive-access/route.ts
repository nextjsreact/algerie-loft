import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'executive'])
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, action } = await request.json()

    if (!userId || action !== 'remove_owner_link') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const supabase = await createClient(true) // Use service role

    // Vérifier si cet utilisateur est lié à un owner
    const { data: linkedOwners, error: checkError } = await supabase
      .from('owners')
      .select('id, name, user_id')
      .eq('user_id', userId)

    if (checkError) {
      console.error('Error checking owner links:', checkError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!linkedOwners || linkedOwners.length === 0) {
      return NextResponse.json({ 
        message: 'No owner links found for this user',
        fixed: false 
      })
    }

    // Supprimer les liens
    const { error: updateError } = await supabase
      .from('owners')
      .update({ user_id: null })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error removing owner links:', updateError)
      return NextResponse.json({ error: 'Failed to remove links' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully removed links for ${linkedOwners.length} owner(s)`,
      removedOwners: linkedOwners.map(o => o.name),
      fixed: true
    })

  } catch (error) {
    console.error('Error in fix-executive-access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}