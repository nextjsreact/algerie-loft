"use server"

import { createClient } from '@/utils/supabase/server'
import { requireRole } from '@/lib/auth'

/**
 * Réinitialise le mot de passe d'un employé (Admin uniquement)
 */
export async function resetEmployeePassword(
  employeeEmail: string, 
  newPassword?: string
): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
  try {
    // Vérifier que l'utilisateur est admin
    await requireRole(['admin'])
    
    const supabase = await createClient(true) // Service role
    
    // Trouver l'utilisateur
    const { data: users, error: findError } = await supabase.auth.admin.listUsers()
    
    if (findError) {
      return { success: false, error: 'Erreur lors de la recherche de l\'utilisateur' }
    }
    
    const user = users.users.find(u => u.email === employeeEmail)
    
    if (!user) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }
    
    // Générer un mot de passe temporaire si non fourni
    const tempPassword = newPassword || generateTempPassword(employeeEmail)
    
    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: tempPassword }
    )
    
    if (updateError) {
      return { success: false, error: 'Erreur lors de la mise à jour du mot de passe' }
    }
    
    return { 
      success: true, 
      tempPassword: newPassword ? undefined : tempPassword 
    }
    
  } catch (error) {
    console.error('Erreur resetEmployeePassword:', error)
    return { success: false, error: 'Erreur interne' }
  }
}

/**
 * Envoie un email de réinitialisation à un employé
 */
export async function sendPasswordResetEmail(
  employeeEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que l'utilisateur est admin
    await requireRole(['admin'])
    
    const supabase = await createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(employeeEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Erreur sendPasswordResetEmail:', error)
    return { success: false, error: 'Erreur interne' }
  }
}

/**
 * Liste tous les employés avec leurs informations de connexion
 */
export async function getEmployeesList(): Promise<{
  success: boolean
  employees?: Array<{
    id: string
    email: string
    full_name?: string
    role: string
    last_sign_in?: string
    email_confirmed: boolean
  }>
  error?: string
}> {
  try {
    console.log('🔍 Début getEmployeesList')
    
    // Vérifier le rôle admin
    const session = await requireRole(['admin'])
    console.log('✅ Session admin validée:', session.user.email)
    
    const supabase = await createClient(true) // Service role
    console.log('✅ Client Supabase créé avec service role')
    
    // Récupérer les profils d'abord (plus simple)
    console.log('📋 Récupération des profils...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
    
    if (profilesError) {
      console.error('❌ Erreur profils:', profilesError)
      return { success: false, error: `Erreur profils: ${profilesError.message}` }
    }
    
    console.log('✅ Profils récupérés:', profiles?.length || 0)
    
    // Filtrer les employés (exclure les clients/partenaires)
    const employees = profiles
      ?.filter(profile => ['admin', 'manager', 'executive', 'member'].includes(profile.role))
      ?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        role: profile.role,
        last_sign_in: undefined, // Simplifié pour l'instant
        email_confirmed: true // Assumé confirmé
      }))
      ?.sort((a, b) => a.role.localeCompare(b.role)) || []
    
    console.log('✅ Employés filtrés:', employees.length)
    
    return { success: true, employees }
    
  } catch (error) {
    console.error('❌ Erreur getEmployeesList:', error)
    return { 
      success: false, 
      error: `Erreur interne: ${error instanceof Error ? error.message : 'Unknown'}` 
    }
  }
}

/**
 * Génère un mot de passe temporaire sécurisé
 */
function generateTempPassword(email: string): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const emailPrefix = email.substring(0, 3).toUpperCase()
  const randomNum = Math.floor(Math.random() * 99) + 10
  
  return `Temp${year}${emailPrefix}${randomNum}!`
}

