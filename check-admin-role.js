import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndFixAdminRole() {
  try {
    console.log('🔍 Vérification des utilisateurs et leurs rôles...\n')
    
    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error)
      return
    }

    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données')
      return
    }

    console.log('👥 Utilisateurs trouvés:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.full_name || 'Nom non défini'} - Rôle: ${user.role || 'non défini'}`)
    })

    // Vérifier s'il y a déjà un admin
    const adminUsers = users.filter(user => user.role === 'admin')
    
    if (adminUsers.length > 0) {
      console.log('\n✅ Administrateur(s) trouvé(s):')
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.full_name || 'Nom non défini'})`)
      })
    } else {
      console.log('\n⚠️  Aucun administrateur trouvé!')
      
      // Proposer de faire du premier utilisateur un admin
      const firstUser = users[0]
      console.log(`\n🔧 Promotion du premier utilisateur en admin: ${firstUser.email}`)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', firstUser.id)

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du rôle:', updateError)
      } else {
        console.log('✅ Utilisateur promu admin avec succès!')
        console.log(`   ${firstUser.email} est maintenant administrateur`)
      }
    }

    console.log('\n📋 Résumé des rôles:')
    const roleCount = {}
    users.forEach(user => {
      const role = user.role || 'non défini'
      roleCount[role] = (roleCount[role] || 0) + 1
    })
    
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} utilisateur(s)`)
    })

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

checkAndFixAdminRole()