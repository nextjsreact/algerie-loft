/**
 * Partner authentication helper.
 * Finds the owner record for the current session user,
 * searching by id first, then by email (since owner.id may differ from auth.user.id).
 */
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export interface PartnerInfo {
  ownerId: string
  ownerName: string
  ownerEmail: string
}

export async function getPartnerInfo(): Promise<PartnerInfo | null> {
  const supabase = await createClient(true)

  // Get current user from Supabase auth directly (most reliable in API routes)
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    return findOwner(supabase, user.id, user.email)
  }

  // Fallback to session helper
  const session = await getSession()
  if (!session) return null
  return findOwner(supabase, session.user.id, session.user.email)
}

async function findOwner(supabase: any, userId: string, userEmail: string | null | undefined): Promise<PartnerInfo | null> {
  // Try by auth user id first
  const { data: byId } = await supabase
    .from('owners')
    .select('id, name, email')
    .eq('id', userId)
    .single()

  if (byId) {
    return { ownerId: byId.id, ownerName: byId.name, ownerEmail: byId.email }
  }

  // Fallback: search by email (owner.id may differ from auth.user.id)
  if (userEmail) {
    const { data: byEmail } = await supabase
      .from('owners')
      .select('id, name, email')
      .eq('email', userEmail)
      .single()

    if (byEmail) {
      return { ownerId: byEmail.id, ownerName: byEmail.name, ownerEmail: byEmail.email }
    }
  }

  return null
}
