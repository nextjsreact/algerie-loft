import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    steps: [] as Array<{step: string, status: 'success' | 'error', message: string, details?: any}>
  }

  const addStep = (step: string, status: 'success' | 'error', message: string, details?: any) => {
    debugInfo.steps.push({ step, status, message, details })
    console.log(`[DEBUG] ${step}: ${status} - ${message}`, details || '')
  }

  try {
    // Étape 1: Vérifier l'authentification
    addStep('Auth', 'success', 'Début du processus d\'authentification')
    let session
    try {
      session = await requireAuth()
      addStep('Auth', 'success', `Utilisateur authentifié: ${session.user.email}`)
    } catch (error) {
      addStep('Auth', 'error', 'Échec de l\'authentification', error instanceof Error ? error.message : error)
      return NextResponse.json({ debugInfo }, { status: 401 })
    }

    // Étape 2: Récupérer le fichier
    addStep('FormData', 'success', 'Récupération des données du formulaire')
    let formData, file
    try {
      formData = await request.formData()
      file = formData.get('file') as File
      
      if (!file) {
        addStep('FormData', 'error', 'Aucun fichier fourni')
        return NextResponse.json({ debugInfo }, { status: 400 })
      }
      
      addStep('FormData', 'success', `Fichier reçu: ${file.name} (${file.size} bytes, ${file.type})`)
    } catch (error) {
      addStep('FormData', 'error', 'Erreur lors de la récupération du fichier', error instanceof Error ? error.message : error)
      return NextResponse.json({ debugInfo }, { status: 400 })
    }

    // Étape 3: Validation du fichier
    addStep('Validation', 'success', 'Validation du fichier')
    if (!file.type.startsWith('image/')) {
      addStep('Validation', 'error', `Type de fichier invalide: ${file.type}`)
      return NextResponse.json({ debugInfo }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      addStep('Validation', 'error', `Fichier trop volumineux: ${file.size} bytes`)
      return NextResponse.json({ debugInfo }, { status: 400 })
    }

    addStep('Validation', 'success', 'Fichier valide')

    // Étape 4: Connexion Supabase
    addStep('Supabase', 'success', 'Initialisation du client Supabase')
    let supabase
    try {
      supabase = await createClient()
      addStep('Supabase', 'success', 'Client Supabase créé')
    } catch (error) {
      addStep('Supabase', 'error', 'Erreur création client Supabase', error instanceof Error ? error.message : error)
      return NextResponse.json({ debugInfo }, { status: 500 })
    }

    // Étape 5: Test de connexion DB
    addStep('Database', 'success', 'Test de connexion à la base de données')
    try {
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (testError) {
        addStep('Database', 'error', 'Erreur de connexion DB', testError)
        return NextResponse.json({ debugInfo }, { status: 500 })
      }
      
      addStep('Database', 'success', 'Connexion DB réussie')
    } catch (error) {
      addStep('Database', 'error', 'Exception connexion DB', error instanceof Error ? error.message : error)
      return NextResponse.json({ debugInfo }, { status: 500 })
    }

    // Étape 6: Vérifier la table loft_photos
    addStep('Table Check', 'success', 'Vérification de la table loft_photos')
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('loft_photos')
        .select('id')
        .limit(1)
      
      if (tableError) {
        addStep('Table Check', 'error', 'Table loft_photos inaccessible', tableError)
        return NextResponse.json({ debugInfo }, { status: 500 })
      }
      
      addStep('Table Check', 'success', 'Table loft_photos accessible')
    } catch (error) {
      addStep('Table Check', 'error', 'Exception table loft_photos', error instanceof Error ? error.message : error)
      return NextResponse.json({ debugInfo }, { status: 500 })
    }

    // Étape 7: Test du storage
    addStep('Storage', 'success', 'Test du storage Supabase')
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
      
      if (storageError) {
        addStep('Storage', 'error', 'Erreur accès storage', storageError)
        return NextResponse.json({ debugInfo }, { status: 500 })
      }
      
      const loftPhotosBucket = buckets?.find(bucket => bucket.id === 'loft-photos')
      if (!loftPhotosBucket) {
        addStep('Storage', 'error', 'Bucket loft-photos non trouvé', { availableBuckets: buckets?.map(b => b.id) })
        return NextResponse.json({ debugInfo }, { status: 500 })
      }
      
      addStep('Storage', 'success', 'Bucket loft-photos trouvé')
    } catch (error) {
      addStep('Storage', 'error', 'Exception storage', error instanceof Error ? error.message : error)
      return NextResponse.json({ debugInfo }, { status: 500 })
    }

    // Étape 8: Upload de test (sans sauvegarde en DB)
    addStep('Upload Test', 'success', 'Test d\'upload vers le storage')
    const fileName = `debug-test-${Date.now()}.${file.name.split('.').pop()}`
    const filePath = `debug/${fileName}`
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('loft-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        addStep('Upload Test', 'error', 'Erreur upload storage', uploadError)
        return NextResponse.json({ debugInfo }, { status: 500 })
      }

      addStep('Upload Test', 'success', `Upload réussi: ${uploadData.path}`)

      // Nettoyer le fichier de test
      await supabase.storage.from('loft-photos').remove([filePath])
      addStep('Cleanup', 'success', 'Fichier de test supprimé')

    } catch (error) {
      addStep('Upload Test', 'error', 'Exception upload', error instanceof Error ? error.message : error)
      return NextResponse.json({ debugInfo }, { status: 500 })
    }

    // Succès complet
    addStep('Complete', 'success', 'Tous les tests sont passés avec succès!')

    return NextResponse.json({
      success: true,
      message: 'Debug complet réussi - L\'upload devrait fonctionner',
      debugInfo
    })

  } catch (error) {
    addStep('Fatal Error', 'error', 'Erreur fatale', error instanceof Error ? error.message : error)
    console.error('Erreur fatale debug upload:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur fatale lors du debug',
      debugInfo
    }, { status: 500 })
  }
}