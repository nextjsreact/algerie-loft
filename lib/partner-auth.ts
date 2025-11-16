import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSession } from './auth'

/**
 * Check if the current user has a verified partner profile
 * Redirects to appropriate page if not verified
 */
export async function requireVerifiedPartner() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Check if user has a partner profile
  const { data: partnerProfile, error } = await supabase
    .from('partner_profiles')
    .select('id, verification_status')
    .eq('user_id', session.user.id)
    .single()

  if (error || !partnerProfile) {
    // No partner profile - redirect to registration
    redirect('/partner/register')
  }

  // Check verification status
  if (partnerProfile.verification_status === 'pending') {
    redirect('/partner/application-pending')
  }

  if (partnerProfile.verification_status === 'rejected') {
    redirect('/partner/rejected')
  }

  // If verified, return the partner profile
  return partnerProfile
}

/**
 * Get partner profile status without redirecting
 */
export async function getPartnerStatus() {
  const session = await getSession()
  
  if (!session) {
    return null
  }

  const supabase = await createClient()
  
  const { data: partnerProfile } = await supabase
    .from('partner_profiles')
    .select('id, verification_status')
    .eq('user_id', session.user.id)
    .single()

  return partnerProfile
}
