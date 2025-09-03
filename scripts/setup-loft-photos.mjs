/**
 * Script pour configurer le système de photos des lofts
 */

import fs from 'fs'

async function setupLoftPhotos() {
  console.log('📸 Configuration du système de photos des lofts...')
  
  try {
    // Lire le schéma SQL
    const schemaPath = 'database/loft-photos-schema.sql'
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Fichier de schéma non trouvé:', schemaPath)
      return
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('\n📋 SQL à exécuter dans Supabase :')
    console.log('=' .repeat(60))
    console.log(sqlContent)
    console.log('=' .repeat(60))

    console.log('\n🔧 Instructions :')
    console.log('1. Copiez le SQL ci-dessus')
    console.log('2. Allez dans votre dashboard Supabase')
    console.log('3. Ouvrez l\'éditeur SQL')
    console.log('4. Collez et exécutez le script')
    
    console.log('\n📦 Configuration du Storage :')
    console.log('1. Allez dans Storage > Buckets')
    console.log('2. Créez un nouveau bucket nommé "loft-photos"')
    console.log('3. Activez "Public bucket" pour permettre l\'accès aux images')
    
    console.log('\n🔐 Politiques de sécurité :')
    console.log('- Les utilisateurs authentifiés peuvent uploader des photos')
    console.log('- Seuls les propriétaires et admins peuvent supprimer')
    console.log('- Toutes les photos sont visibles par les utilisateurs authentifiés')

    console.log('\n✅ Fonctionnalités ajoutées :')
    console.log('- Upload de photos par drag & drop')
    console.log('- Galerie avec visionneuse plein écran')
    console.log('- Téléchargement des photos')
    console.log('- Gestion des métadonnées (taille, type, etc.)')
    console.log('- Suppression sécurisée')

    console.log('\n🎯 Prochaines étapes :')
    console.log('1. Exécuter le SQL dans Supabase')
    console.log('2. Configurer le bucket de storage')
    console.log('3. Tester l\'upload de photos dans un loft')

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message)
  }
}

// Exécuter le script
setupLoftPhotos()