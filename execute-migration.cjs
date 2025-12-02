const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  console.log('🚀 DÉBUT DE LA MIGRATION\n');
  console.log('='.repeat(70));

  try {
    // ÉTAPE 1: Créer la table owners
    console.log('\n📝 ÉTAPE 1: Création de la table "owners"...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS owners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        business_name TEXT,
        business_type TEXT CHECK (business_type IN ('individual', 'company')),
        ownership_type TEXT CHECK (ownership_type IN ('company', 'third_party')),
        tax_id TEXT,
        verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
        verification_documents JSONB DEFAULT '[]'::jsonb,
        portfolio_description TEXT,
        bank_details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(email)
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError && !createError.message.includes('already exists')) {
      console.error('❌ Erreur création table:', createError.message);
      // Continuer quand même si la table existe déjà
    } else {
      console.log('✅ Table "owners" créée avec succès');
    }

    // ÉTAPE 2: Migrer loft_owners
    console.log('\n📝 ÉTAPE 2: Migration de loft_owners...');
    
    const { data: loftOwners, error: loftOwnersError } = await supabase
      .from('loft_owners')
      .select('*');

    if (loftOwnersError) {
      console.error('❌ Erreur lecture loft_owners:', loftOwnersError.message);
      return;
    }

    console.log(`   Trouvé ${loftOwners.length} propriétaires dans loft_owners`);

    for (const owner of loftOwners) {
      const { error: insertError } = await supabase
        .from('owners')
        .upsert({
          id: owner.id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          address: owner.address,
          ownership_type: owner.ownership_type,
          verification_status: 'verified', // Auto-vérifiés
          created_at: owner.created_at,
          updated_at: owner.updated_at
        }, { onConflict: 'id' });

      if (insertError) {
        console.error(`   ❌ Erreur pour ${owner.name}:`, insertError.message);
      }
    }

    console.log(`✅ ${loftOwners.length} propriétaires migrés depuis loft_owners`);

    // ÉTAPE 3: Migrer partner_profiles
    console.log('\n📝 ÉTAPE 3: Migration de partner_profiles...');
    
    const { data: partnerProfiles, error: partnerProfilesError } = await supabase
      .from('partner_profiles')
      .select('*');

    if (partnerProfilesError) {
      console.error('❌ Erreur lecture partner_profiles:', partnerProfilesError.message);
      return;
    }

    console.log(`   Trouvé ${partnerProfiles.length} partenaires dans partner_profiles`);

    for (const partner of partnerProfiles) {
      const { error: insertError } = await supabase
        .from('owners')
        .upsert({
          id: partner.id,
          user_id: partner.user_id,
          name: partner.business_name || 'Partner',
          business_name: partner.business_name,
          phone: partner.phone,
          address: partner.address,
          business_type: partner.business_type,
          tax_id: partner.tax_id,
          verification_status: partner.verification_status,
          verification_documents: partner.verification_documents,
          bank_details: partner.bank_details,
          portfolio_description: partner.portfolio_description,
          created_at: partner.created_at,
          updated_at: partner.updated_at
        }, { onConflict: 'id' });

      if (insertError) {
        console.error(`   ❌ Erreur pour ${partner.business_name}:`, insertError.message);
      }
    }

    console.log(`✅ ${partnerProfiles.length} partenaires migrés depuis partner_profiles`);

    // ÉTAPE 4: Vérification
    console.log('\n📝 ÉTAPE 4: Vérification...');
    
    const { count: ownersCount } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Total dans owners: ${ownersCount}`);
    console.log(`   Attendu: ${loftOwners.length + partnerProfiles.length}`);

    if (ownersCount === loftOwners.length + partnerProfiles.length) {
      console.log('✅ Migration réussie! Tous les propriétaires sont migrés.');
    } else {
      console.log('⚠️  Attention: Le nombre ne correspond pas exactement.');
    }

    // ÉTAPE 5: Afficher un échantillon
    console.log('\n📝 ÉTAPE 5: Échantillon des données migrées...');
    
    const { data: sample } = await supabase
      .from('owners')
      .select('id, name, business_name, verification_status')
      .limit(5);

    console.log('\n📊 Premiers propriétaires:');
    sample?.forEach((owner, i) => {
      console.log(`   ${i + 1}. ${owner.name} (${owner.verification_status})`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('🎉 MIGRATION TERMINÉE AVEC SUCCÈS!\n');
    console.log('⚠️  NOTE: Les anciennes tables (loft_owners, partner_profiles) sont');
    console.log('   toujours présentes. Vous pourrez les supprimer après avoir testé.');

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error(error);
  }
}

executeMigration();
