import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { action, resolution } = await request.json()
    
    // Get current user and verify admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager', 'executive'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const disputeId = params.id

    // For now, return success since we're using mock data
    // In a real implementation, you would update the booking_disputes table
    
    /* Real implementation would be:
    
    // Get current dispute
    const { data: dispute, error: fetchError } = await supabase
      .from('booking_disputes')
      .select('*')
      .eq('id', disputeId)
      .single()

    if (fetchError || !dispute) {
      return NextResponse.json({ error: 'Litige non trouvé' }, { status: 404 })
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'investigate':
        if (dispute.status !== 'open') {
          return NextResponse.json({ error: 'Seuls les litiges ouverts peuvent être pris en charge' }, { status: 400 })
        }
        updateData.status = 'investigating'
        break

      case 'resolve':
        if (dispute.status !== 'investigating') {
          return NextResponse.json({ error: 'Seuls les litiges en cours peuvent être résolus' }, { status: 400 })
        }
        if (!resolution) {
          return NextResponse.json({ error: 'Une résolution est requise' }, { status: 400 })
        }
        updateData.status = 'resolved'
        updateData.resolution = resolution
        break

      case 'close':
        if (dispute.status !== 'resolved') {
          return NextResponse.json({ error: 'Seuls les litiges résolus peuvent être fermés' }, { status: 400 })
        }
        updateData.status = 'closed'
        break

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('booking_disputes')
      .update(updateData)
      .eq('id', disputeId)

    if (updateError) throw updateError

    // TODO: Send notifications to involved parties
    */

    // Mock success response
    console.log(`Dispute ${disputeId} action: ${action}`, resolution ? `Resolution: ${resolution}` : '')

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating dispute:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du litige' },
      { status: 500 }
    )
  }
}