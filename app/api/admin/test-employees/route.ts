import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🧪 Test API /admin/test-employees')
  
  try {
    // Test 1: Connexion Supabase
    console.log('1️⃣ Test connexion Supabase...')
    const supabase = await createClient(true)
    
    // Test 2: Lecture simple de la table profiles
    console.log('2️⃣ Test lecture profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Erreur profiles:', profilesError)
      return NextResponse.json({
        success: false,
        error: `Erreur profiles: ${profilesError.message}`,
        details: profilesError
      })
    }
    
    console.log('✅ Profiles récupérés:', profiles?.length)
    
    // Test 3: Compter par rôle
    const roleCounts = profiles?.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      message: 'Tests réussis',
      data: {
        profilesCount: profiles?.length || 0,
        roleCounts,
        sampleProfiles: profiles?.slice(0, 3)
      }
    })
    
  } catch (error) {
    console.error('❌ Test Error:', error)
    return NextResponse.json({
      success: false,
      error: `Erreur test: ${error instanceof Error ? error.message : 'Unknown'}`,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}