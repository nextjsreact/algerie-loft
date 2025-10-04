// Script de diagnostic pour vérifier le rôle utilisateur
const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase (remplacez par vos vraies valeurs)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Définie' : '❌ Manquante')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserRole() {
  try {
    console.log('🔍 Vérification des utilisateurs dans la base de données...')
    
    // Récupérer tous les utilisateurs avec leurs rôles
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error)
      return
    }

    if (!users || users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé dans la table profiles')
      return
    }

    console.log('\n📋 Liste des utilisateurs:')
    console.log('='.repeat(80))
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'Nom non défini'} (${user.email})`)
      console.log(`   Rôle: ${user.role}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Créé le: ${new Date(user.created_at).toLocaleString('fr-FR')}`)
      console.log('-'.repeat(40))
    })

    // Compter les administrateurs
    const admins = users.filter(user => user.role === 'admin')
    console.log(`\n👑 Nombre d'administrateurs: ${admins.length}`)
    
    if (admins.length > 0) {
      console.log('📝 Administrateurs:')
      admins.forEach(admin => {
        console.log(`   - ${admin.full_name || admin.email} (${admin.email})`)
      })
    }

    // Vérifier si la fonctionnalité de gestion des mots de passe devrait être visible
    console.log('\n🔐 Fonctionnalité de gestion des mots de passe:')
    if (admins.length > 0) {
      console.log('✅ Devrait être visible pour les administrateurs')
      console.log('📍 Chemin: /settings/user-passwords')
      console.log('🔗 URL complète: http://localhost:3000/fr/settings/user-passwords')
    } else {
      console.log('❌ Aucun administrateur trouvé - fonctionnalité non visible')
    }

  } catch (error) {
    console.error('💥 Erreur inattendue:', error)
  }
}

checkUserRole()