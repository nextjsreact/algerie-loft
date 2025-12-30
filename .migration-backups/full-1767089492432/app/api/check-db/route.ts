import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const checks = {
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        loft_photos_table: false,
        lofts_table: false,
      },
      storage: {
        accessible: false,
        loft_photos_bucket: false,
      },
      auth: {
        service_available: false,
      }
    }

    // Test 1: Connexion base de données
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1)
      if (!error) {
        checks.database.connected = true
      }
    } catch (error) {
      console.log('DB connection error:', error)
    }

    // Test 2: Table lofts
    try {
      const { data, error } = await supabase.from('lofts').select('id').limit(1)
      if (!error) {
        checks.database.lofts_table = true
      }
    } catch (error) {
      console.log('Lofts table error:', error)
    }

    // Test 3: Table loft_photos
    try {
      const { data, error } = await supabase.from('loft_photos').select('id').limit(1)
      if (!error) {
        checks.database.loft_photos_table = true
      }
    } catch (error) {
      console.log('Loft_photos table error:', error)
    }

    // Test 4: Storage accessible
    try {
      const { data, error } = await supabase.storage.listBuckets()
      if (!error) {
        checks.storage.accessible = true
        
        // Test 5: Bucket loft-photos
        const loftPhotosBucket = data?.find(bucket => bucket.id === 'loft-photos')
        if (loftPhotosBucket) {
          checks.storage.loft_photos_bucket = true
        }
      }
    } catch (error) {
      console.log('Storage error:', error)
    }

    // Test 6: Auth service
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      checks.auth.service_available = !error
    } catch (error) {
      console.log('Auth error:', error)
    }

    return NextResponse.json({
      success: true,
      checks,
      recommendations: generateRecommendations(checks)
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      checks: null
    }, { status: 500 })
  }
}

function generateRecommendations(checks: any): string[] {
  const recommendations: string[] = []

  if (!checks.database.connected) {
    recommendations.push('❌ Vérifiez la connexion à la base de données Supabase')
  }

  if (!checks.database.loft_photos_table) {
    recommendations.push('❌ Exécutez la migration: supabase db push ou utilisez le script de migration')
  }

  if (!checks.storage.accessible) {
    recommendations.push('❌ Vérifiez la configuration du storage Supabase')
  }

  if (!checks.storage.loft_photos_bucket) {
    recommendations.push('❌ Créez le bucket "loft-photos" dans Supabase Storage')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Toutes les vérifications sont passées avec succès!')
  }

  return recommendations
}