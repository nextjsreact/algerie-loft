import { requireRole } from "@/lib/auth"
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
    redirect(`/${locale}/client/lofts`)
  }

  const supabase = await createClient(true) // Use service role for data access

  try {
    // Déterminer si l'utilisateur est un employé ou un propriétaire
    const isEmployee = ['admin', 'manager', 'executive', 'superuser'].includes(session.user.role);
    const isOwner = session.user.role === 'owner' || !isEmployee;

    // 🔍 DEBUG : Afficher les informations de session
    console.log('🔍 [DEBUG EXECUTIVE] Session user:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      full_name: session.user.full_name
    });
    console.log('🔍 [DEBUG EXECUTIVE] Flags:', {
      isEmployee,
      isOwner,
      roleCheck: ['admin', 'manager', 'executive', 'superuser'].includes(session.user.role)
    });

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
}