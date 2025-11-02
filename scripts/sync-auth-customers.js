/**
 * Script de synchronisation auth.users -> public.customers
 * À exécuter côté serveur pour synchroniser les utilisateurs existants
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase (utiliser les variables d'environnement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncAuthUsersToCustomers() {
  console.log('🔄 Début de la synchronisation auth.users -> customers...')

  try {
    // 1. Récupérer tous les utilisateurs avec le rôle 'client'
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Erreur récupération auth.users: ${authError.message}`)
    }

    const clientUsers = authUsers.users.filter(user => 
      user.user_metadata?.role === 'client'
    )

    console.log(`📊 Trouvé ${clientUsers.length} utilisateurs clients dans auth.users`)

    // 2. Vérifier quels clients existent déjà dans customers
    const { data: existingCustomers, error: customersError } = await supabase
      .from('customers')
      .select('id')

    if (customersError) {
      throw new Error(`Erreur récupération customers: ${customersError.message}`)
    }

    const existingCustomerIds = new Set(existingCustomers.map(c => c.id))
    console.log(`📊 Trouvé ${existingCustomers.length} clients existants dans customers`)

    // 3. Créer les enregistrements manquants
    const missingClients = clientUsers.filter(user => !existingCustomerIds.has(user.id))
    console.log(`🔍 ${missingClients.length} clients à synchroniser`)

    if (missingClients.length === 0) {
      console.log('✅ Tous les clients sont déjà synchronisés !')
      return
    }

    // 4. Insérer les clients manquants
    const customersToInsert = missingClients.map(user => {
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client'
      const [firstName, ...lastNameParts] = fullName.split(' ')
      const lastName = lastNameParts.join(' ') || firstName

      return {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        status: 'active',
        email_verified: user.email_confirmed_at ? true : false,
        preferences: {
          language: 'fr',
          currency: 'DZD',
          notifications: {
            email: true,
            sms: false,
            marketing: false
          }
        },
        created_by: user.id,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at
      }
    })

    const { data: insertedCustomers, error: insertError } = await supabase
      .from('customers')
      .insert(customersToInsert)
      .select()

    if (insertError) {
      throw new Error(`Erreur insertion customers: ${insertError.message}`)
    }

    console.log(`✅ ${insertedCustomers?.length || 0} clients synchronisés avec succès !`)

    // 5. Rapport final
    console.log('\n📊 RAPPORT DE SYNCHRONISATION:')
    console.log(`- Utilisateurs clients dans auth.users: ${clientUsers.length}`)
    console.log(`- Clients existants dans customers: ${existingCustomers.length}`)
    console.log(`- Clients synchronisés: ${insertedCustomers?.length || 0}`)
    console.log('✅ Synchronisation terminée avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message)
    process.exit(1)
  }
}

// Exécuter la synchronisation
syncAuthUsersToCustomers()