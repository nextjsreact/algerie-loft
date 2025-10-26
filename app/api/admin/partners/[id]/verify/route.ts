import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { action, reason } = await request.json()
    
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

    const partnerId = params.id

    // Get current partner profile
    const { data: partnerProfile, error: fetchError } = await supabase
      .from('partner_profiles')
      .select(`
        *,
        profiles!partner_profiles_user_id_fkey(full_name, email)
      `)
      .eq('id', partnerId)
      .single()

    if (fetchError || !partnerProfile) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    if (partnerProfile.verification_status !== 'pending') {
      return NextResponse.json({ error: 'Seuls les partenaires en attente peuvent être traités' }, { status: 400 })
    }

    let newStatus: string
    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'approve':
        newStatus = 'verified'
        updateData.verification_status = 'verified'
        break

      case 'reject':
        newStatus = 'rejected'
        updateData.verification_status = 'rejected'
        if (reason) {
          updateData.rejection_reason = reason
        }
        break

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

    // Update partner profile
    const { error: updateError } = await supabase
      .from('partner_profiles')
      .update(updateData)
      .eq('id', partnerId)

    if (updateError) {
      throw updateError
    }

    // If approved, also update the user's role to 'partner'
    if (action === 'approve') {
      const { error: roleUpdateError } = await supabase
        .from('profiles')
        .update({ role: 'partner' })
        .eq('id', partnerProfile.user_id)

      if (roleUpdateError) {
        console.error('Error updating user role:', roleUpdateError)
        // Don't fail the request, but log the error
      }
    }

    // TODO: Send notification email to the partner
    console.log(`Partner ${partnerId} ${action}ed by admin ${user.id}`, reason ? `Reason: ${reason}` : '')

    /* In a real implementation, you would send an email:
    if (action === 'approve') {
      await sendEmail({
        to: partnerProfile.profiles.email,
        subject: 'Votre demande de partenariat a été approuvée',
        template: 'partner-approved',
        data: {
          name: partnerProfile.profiles.full_name,
          business_name: partnerProfile.business_name
        }
      })
    } else {
      await sendEmail({
        to: partnerProfile.profiles.email,
        subject: 'Votre demande de partenariat a été rejetée',
        template: 'partner-rejected',
        data: {
          name: partnerProfile.profiles.full_name,
          reason: reason || 'Aucune raison spécifiée'
        }
      })
    }
    */

    return NextResponse.json({ 
      success: true,
      message: `Partenaire ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`
    })

  } catch (error) {
    console.error('Error verifying partner:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du partenaire' },
      { status: 500 }
    )
  }
}