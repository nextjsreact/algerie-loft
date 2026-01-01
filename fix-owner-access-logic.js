#!/usr/bin/env node

/**
 * Fix de la logique d'accès propriétaires vs employés
 * Corrige les permissions pour que les propriétaires ne voient que leurs lofts
 */

import fs from 'fs';

console.log('🔧 Correction de la logique d\'accès propriétaires...\n');

// 1. Page lofts corrigée avec logique propriétaire
const correctedLoftsPage = `import { requireRole } from "@/lib/auth"
import type { Database, LoftWithRelations } from "@/lib/types"
import { LoftsWrapper } from "@/components/lofts/lofts-wrapper"
import { MemberLoftsClientWrapper } from "@/components/lofts/member-lofts-client-wrapper"
import { OwnerLoftsWrapper } from "@/components/lofts/owner-lofts-wrapper"
import { createClient } from '@/utils/supabase/server'

type Loft = Database['public']['Tables']['lofts']['Row']
type LoftOwner = Database['public']['Tables']['owners']['Row']
type ZoneArea = Database['public']['Tables']['zone_areas']['Row']

export default async function LoftsPage() {
  const session = await requireRole(["admin", "manager", "member", "executive", "client", "owner"]);
  
  // Si l'utilisateur est un membre, afficher la vue spéciale membre
  if (session.user.role === 'member') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <MemberLoftsClientWrapper />
      </div>
    );
  }
  
  // Si l'utilisateur est un client, rediriger vers la page client
  if (session.user.role === 'client') {
    const { redirect } = await import('next/navigation')
    const locale = session.user.email?.includes('@') ? 'fr' : 'fr' // Default to fr
    redirect(\`/\${locale}/client/lofts\`)
  }

  const supabase = await createClient(true) // Use service role for data access

  try {
    // Déterminer si l'utilisateur est un employé ou un propriétaire
    const isEmployee = ['admin', 'manager', 'executive', 'superuser'].includes(session.user.role);
    const isOwner = session.user.role === 'owner' || !isEmployee;

    let loftsData, ownersData, zoneAreasData;

    if (isEmployee) {
      // EMPLOYÉS : Accès à TOUS les lofts et owners
      console.log('👔 Accès employé - Chargement de toutes les données');
      
      const [loftsResult, ownersResult, zoneAreasResult] = await Promise.all([
        supabase
          .from("lofts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("owners")
          .select("*")
          .order("name"),
        supabase
          .from("zone_areas")
          .select("*")
          .order("name")
      ]);

      loftsData = loftsResult.data || [];
      ownersData = ownersResult.data || [];
      zoneAreasData = zoneAreasResult.data || [];

      if (loftsResult.error) console.error("Lofts error:", loftsResult.error);
      if (ownersResult.error) console.error("Owners error:", ownersResult.error);
      if (zoneAreasResult.error) console.error("Zone areas error:", zoneAreasResult.error);

    } else {
      // PROPRIÉTAIRES : Accès uniquement à LEURS lofts
      console.log('🏠 Accès propriétaire - Chargement des lofts personnels');
      
      // Trouver l'owner correspondant à cet utilisateur
      const { data: ownerProfile, error: ownerError } = await supabase
        .from("owners")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (ownerError || !ownerProfile) {
        console.error("Owner profile not found:", ownerError);
        return (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
            <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-xl">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚫</span>
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Accès Refusé</h1>
              <p className="text-gray-600 mb-4">
                Votre profil propriétaire n'a pas été trouvé.
              </p>
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                Contactez l'administrateur pour configurer votre accès propriétaire.
              </p>
            </div>
          </div>
        );
      }

      // Récupérer uniquement les lofts de ce propriétaire
      const [loftsResult, zoneAreasResult] = await Promise.all([
        supabase
          .from("lofts")
          .select("*")
          .eq("owner_id", ownerProfile.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("zone_areas")
          .select("*")
          .order("name")
      ]);

      loftsData = loftsResult.data || [];
      ownersData = [ownerProfile]; // Seulement ce propriétaire
      zoneAreasData = zoneAreasResult.data || [];

      if (loftsResult.error) console.error("Owner lofts error:", loftsResult.error);
      if (zoneAreasResult.error) console.error("Zone areas error:", zoneAreasResult.error);
    }

    // Créer un map des propriétaires et zones pour les relations
    const ownersMap = new Map((ownersData || []).map(owner => [owner.id, owner.name || owner.business_name]))
    const zonesMap = new Map((zoneAreasData || []).map(zone => [zone.id, zone.name]))

    const lofts = (loftsData || []).map(loft => ({
      ...loft,
      owner_name: ownersMap.get(loft.owner_id) || null,
      zone_area_name: zonesMap.get(loft.zone_area_id) || null
    })) as LoftWithRelations[]

    const owners = ownersData || []
    const zoneAreas = zoneAreasData || []
    const isAdmin = session.user.role === "admin"
    const canManage = ["admin", "manager"].includes(session.user.role)
    const canViewFinancial = ["admin", "manager", "executive"].includes(session.user.role)

    // Utiliser le wrapper approprié selon le type d'utilisateur
    if (isOwner && !isEmployee) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="container mx-auto px-4 py-8">
            <OwnerLoftsWrapper
              lofts={lofts}
              owner={owners[0]} // Le propriétaire connecté
              zoneAreas={zoneAreas}
              userRole={session.user.role}
            />
          </div>
        </div>
      )
    } else {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="container mx-auto px-4 py-8">
            <LoftsWrapper
              lofts={lofts}
              owners={owners}
              zoneAreas={zoneAreas}
              isAdmin={isAdmin}
              canManage={canManage}
              userRole={session.user.role}
            />
          </div>
        </div>
      )
    }
  } catch (error) {
    console.error("Error fetching lofts page data:", error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🚨</span>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Erreur système</h1>
          <p className="text-gray-600 mb-6">
            Une erreur inattendue s'est produite lors du chargement de la page.
          </p>
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
              Détails techniques
            </summary>
            <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-32">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}`;

// 2. Composant OwnerLoftsWrapper pour les propriétaires
const ownerLoftsWrapper = `"use client"

import { useTranslations, useLocale } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Home, MapPin, TrendingUp, User } from "lucide-react"
import { LoftsList } from "@/components/lofts/lofts-list"
import type { LoftWithRelations, LoftOwner, ZoneArea, UserRole } from "@/lib/types"
import { formatCurrencyAuto } from "@/utils/currency-formatter"

interface OwnerLoftsWrapperProps {
  lofts: LoftWithRelations[]
  owner: LoftOwner
  zoneAreas: ZoneArea[]
  userRole: UserRole
}

export function OwnerLoftsWrapper({
  lofts,
  owner,
  zoneAreas,
  userRole
}: OwnerLoftsWrapperProps) {
  const locale = useLocale()
  const t = useTranslations('lofts')
  
  // Statistiques du propriétaire
  const availableLofts = lofts.filter(loft => loft.status === 'available').length
  const occupiedLofts = lofts.filter(loft => loft.status === 'occupied').length
  const maintenanceLofts = lofts.filter(loft => loft.status === 'maintenance').length
  const totalRevenue = lofts.reduce((sum, loft) => sum + (loft.price_per_night || 0), 0)

  return (
    <div className="space-y-8">
      {/* En-tête propriétaire */}
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 opacity-90"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: \`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")\`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative px-8 py-12 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <User className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Mes Propriétés
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              Bienvenue, {owner.name || owner.business_name}
            </p>
            <p className="text-lg text-blue-200">
              Gérez vos {lofts.length} propriété{lofts.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques propriétaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Disponibles</p>
              <p className="text-3xl font-bold text-green-700">{availableLofts}</p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <Home className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Occupés</p>
              <p className="text-3xl font-bold text-blue-700">{occupiedLofts}</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-6 rounded-2xl border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Maintenance</p>
              <p className="text-3xl font-bold text-yellow-700">{maintenanceLofts}</p>
            </div>
            <div className="p-3 bg-yellow-200 rounded-full">
              <MapPin className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Revenus Totaux</p>
              <p className="text-2xl font-bold text-purple-700">{formatCurrencyAuto(totalRevenue, 'DZD', \`/\${locale}/lofts\`)}</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Message si aucun loft */}
      {lofts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-lg border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Home className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Aucune propriété</h3>
            <p className="text-gray-600 mb-8">
              Vous n'avez pas encore de propriétés enregistrées.
            </p>
            <p className="text-sm text-blue-600">
              Contactez l'administrateur pour ajouter vos propriétés.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <LoftsList
            lofts={lofts}
            owners={[owner]} // Seulement ce propriétaire
            zoneAreas={zoneAreas}
            isAdmin={false} // Les propriétaires ne sont pas admin
            userRole={userRole}
          />
        </div>
      )}
    </div>
  )
}`;

// Appliquer les corrections
try {
  // 1. Corriger la page lofts
  if (fs.existsSync('app/[locale]/lofts/page.tsx')) {
    fs.copyFileSync('app/[locale]/lofts/page.tsx', 'app/[locale]/lofts/page.tsx.backup');
    fs.writeFileSync('app/[locale]/lofts/page.tsx', correctedLoftsPage);
    console.log('✅ Page lofts corrigée avec logique propriétaire (backup créé)');
  }

  // 2. Créer le composant OwnerLoftsWrapper
  if (!fs.existsSync('components/lofts')) {
    fs.mkdirSync('components/lofts', { recursive: true });
  }
  fs.writeFileSync('components/lofts/owner-lofts-wrapper.tsx', ownerLoftsWrapper);
  console.log('✅ Composant OwnerLoftsWrapper créé');

  console.log('\n🎯 Logique d\'accès corrigée:');
  console.log('• EMPLOYÉS (admin, manager, executive, superuser):');
  console.log('  → Voient TOUS les lofts et TOUS les owners');
  console.log('  → Dropdown avec tous les 26 owners');
  console.log('');
  console.log('• PROPRIÉTAIRES (owner ou autres):');
  console.log('  → Voient SEULEMENT leurs propres lofts');
  console.log('  → Dropdown avec seulement leur nom');
  console.log('');
  console.log('• La logique se base sur:');
  console.log('  → owners.user_id = session.user.id');
  console.log('  → lofts.owner_id = owner.id');

  console.log('\n📋 Prochaines étapes:');
  console.log('1. Redémarrez votre serveur: npm run dev');
  console.log('2. Testez avec un compte EMPLOYÉ → Devrait voir tous les owners');
  console.log('3. Testez avec un compte PROPRIÉTAIRE → Devrait voir seulement ses lofts');
  console.log('4. Vérifiez que la table owners a bien user_id configuré');

} catch (error) {
  console.error('❌ Erreur lors de la correction:', error);
}