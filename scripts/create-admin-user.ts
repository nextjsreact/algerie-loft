import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    // Créer un utilisateur admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@loftalgerie.com',
      password: 'Admin123!',
      email_confirm: true
    })

    if (authError) {
      console.error('Erreur création utilisateur:', authError)
      return
    }

    console.log('✅ Utilisateur créé:', authData.user?.email)

    // Créer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        email: authData.user!.email,
        full_name: 'Administrateur',
        role: 'executive'
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
      return
    }

    console.log('✅ Profil créé avec succès')
    console.log('📧 Email: admin@loftalgerie.com')
    console.log('🔑 Mot de passe: Admin123!')

  } catch (error) {
    console.error('Erreur:', error)
  }
}

createAdminUser()