#!/usr/bin/env node

import fs from 'fs';

/**
 * Créer une version simplifiée du fichier loft page pour tester
 */
console.log('🔧 Création d\'une version simplifiée du fichier loft page...\n');

const simplifiedContent = `import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"

export default async function LoftDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const awaitedParams = await params;

  try {
    const session = await requireRole(["admin", "manager"])
    const supabase = await createClient()

    // Récupérer les traductions
    const t = await getTranslations('lofts')
    const tDetails = await getTranslations('lofts.details')
    const tCommon = await getTranslations('common')

    // Test simple sans jointure d'abord
    const { data: loft, error } = await supabase
      .from("lofts")
      .select("*")
      .eq("id", awaitedParams.id)
      .single()

    if (error) {
      console.error("Erreur récupération loft:", error)
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-red-600">Erreur</h1>
            <p className="text-muted-foreground">Erreur lors de la récupération du loft: {error.message}</p>
            <p className="text-sm text-gray-500">ID recherché: {awaitedParams.id}</p>
          </div>
        </div>
      )
    }

    if (!loft) {
      return notFound()
    }

    return (
      <div className="container mx-auto py-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{tDetails('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{loft.name}</h3>
                <p className="text-muted-foreground">{loft.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">{tDetails('pricePerNight')}:</span>
                  <span className="ml-2">{loft.price_per_night} {loft.currency}</span>
                </div>
                <div>
                  <span className="font-medium">{tDetails('owner')}:</span>
                  <span className="ml-2">{loft.owner_name || 'Non spécifié'}</span>
                </div>
              </div>
              
              {loft.description && (
                <div>
                  <h4 className="font-medium mb-2">{tDetails('description')}</h4>
                  <p className="text-sm text-muted-foreground">{loft.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )

  } catch (error) {
    console.error("Erreur dans LoftDetailPage:", error)
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Erreur</h2>
              <p className="text-muted-foreground">
                Une erreur est survenue lors du chargement de la page.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {error instanceof Error ? error.message : 'Erreur inconnue'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}`;

// Sauvegarder l'original
const originalPath = 'app/[locale]/lofts/[id]/page.tsx';
const backupPath = 'app/[locale]/lofts/[id]/page.tsx.backup';

try {
  // Créer une sauvegarde
  const originalContent = fs.readFileSync(originalPath, 'utf8');
  fs.writeFileSync(backupPath, originalContent, 'utf8');
  console.log('✅ Sauvegarde créée: page.tsx.backup');
  
  // Écrire la version simplifiée
  fs.writeFileSync(originalPath, simplifiedContent, 'utf8');
  console.log('✅ Version simplifiée créée');
  
  console.log('\n💡 Instructions:');
  console.log('1. Testez maintenant: npm run dev');
  console.log('2. Si ça fonctionne, le problème vient du contenu complexe');
  console.log('3. Pour restaurer l\'original: node scripts/restore-loft-page.js');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

console.log('\n✨ Version simplifiée créée !');