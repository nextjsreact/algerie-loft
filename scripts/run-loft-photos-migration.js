#!/usr/bin/env node

/**
 * Script pour exécuter la migration de création de la table loft_photos
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase (à adapter selon votre environnement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Début de la migration loft_photos...')
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'supabase_migrations', '27-create-loft-photos-table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution de la migration:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration loft_photos exécutée avec succès!')
    
    // Vérifier que la table a été créée
    const { data: tableCheck, error: checkError } = await supabase
      .from('loft_photos')
      .select('count(*)')
      .limit(1)
    
    if (checkError) {
      console.warn('⚠️  Impossible de vérifier la table:', checkError.message)
    } else {
      console.log('✅ Table loft_photos accessible')
    }
    
    // Vérifier que le bucket existe
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.warn('⚠️  Impossible de vérifier les buckets:', bucketError.message)
    } else {
      const loftPhotosBucket = buckets.find(bucket => bucket.id === 'loft-photos')
      if (loftPhotosBucket) {
        console.log('✅ Bucket loft-photos trouvé')
      } else {
        console.warn('⚠️  Bucket loft-photos non trouvé, il faudra le créer manuellement')
      }
    }
    
    console.log('\n🎉 Migration terminée avec succès!')
    console.log('Vous pouvez maintenant utiliser l\'upload de photos pour les lofts.')
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    process.exit(1)
  }
}

// Fonction alternative si exec_sql n'existe pas
async function runMigrationAlternative() {
  try {
    console.log('🚀 Exécution alternative de la migration...')
    
    // Créer la table directement
    const { error: tableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.loft_photos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL UNIQUE,
          file_size INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          url TEXT NOT NULL,
          uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (tableError) {
      console.error('❌ Erreur création table:', tableError)
    } else {
      console.log('✅ Table loft_photos créée')
    }
    
  } catch (error) {
    console.error('❌ Erreur alternative:', error)
  }
}

// Exécuter la migration
runMigration().catch(() => {
  console.log('Tentative avec méthode alternative...')
  runMigrationAlternative()
})