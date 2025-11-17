import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestPartners() {
  console.log('🏢 Creating test partners...\n')

  const testPartners = [
    {
      business_name: 'Immobilier Alger',
      business_type: 'company',
      phone: '+213 555 123 456',
      address: 'Rue Didouche Mourad, Alger',
      verification_status: 'verified',
      portfolio_description: 'Spécialisé dans les appartements de luxe au centre d\'Alger'
    },
    {
      business_name: 'Oran Properties',
      business_type: 'company',
      phone: '+213 555 234 567',
      address: 'Boulevard de la Soummam, Oran',
      verification_status: 'verified',
      portfolio_description: 'Gestion de propriétés résidentielles et commerciales'
    },
    {
      business_name: 'Karim Mansouri',
      business_type: 'individual',
      phone: '+213 555 345 678',
      address: 'Cité des Asphodèles, Constantine',
      verification_status: 'verified',
      portfolio_description: 'Propriétaire indépendant de 3 appartements'
    },
    {
      business_name: 'Annaba Lofts',
      business_type: 'company',
      phone: '+213 555 456 789',
      address: 'Cours de la Révolution, Annaba',
      verification_status: 'verified',
      portfolio_description: 'Lofts modernes près de la plage'
    },
    {
      business_name: 'Tlemcen Residences',
      business_type: 'company',
      phone: '+213 555 567 890',
      address: 'Avenue de l\'Indépendance, Tlemcen',
      verification_status: 'pending',
      portfolio_description: 'Appartements traditionnels rénovés'
    }
  ]

  for (const partner of testPartners) {
    const { data, error} = await supabase
      .from('partner_profiles')
      .insert([partner])
      .select()

    if (error) {
      console.error(`❌ Error creating ${partner.business_name}:`, error.message)
    } else {
      console.log(`✅ Created: ${partner.business_name}`)
    }
  }

  console.log('\n✅ Test partners created successfully!')
  console.log('\n📝 Note: These are test data. You can delete them later.')
}

createTestPartners()
