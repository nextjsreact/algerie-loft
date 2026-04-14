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
  const session = await getSession()
  if (!session) return null

  const supabase = await createClient(true)

  // Try by auth user id first
  const { data: byId } = await supabase
    .from('owners')
    .select('id, name, email')
    .eq('id', session.user.id)
    .single()

  if (byId) {
    return { ownerId: byId.id, ownerName: byId.name, ownerEmail: byId.email }
  }

  // Fallback: search by email
  if (session.user.email) {
    const { data: byEmail } = await supabase
      .from('owners')
      .select('id, name, email')
      .eq('email', session.user.email)
      .single()

    if (byEmail) {
      return { ownerId: byEmail.id, ownerName: byEmail.name, ownerEmail: byEmail.email }
    }
  }

  return null
}
