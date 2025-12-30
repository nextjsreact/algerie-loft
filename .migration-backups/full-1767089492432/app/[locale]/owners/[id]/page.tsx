import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar } from "lucide-react"

interface OwnerDetailPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function OwnerDetailPage({ params }: OwnerDetailPageProps) {
  const { locale, id } = await params
  await requireRole(["admin"])
  
  const supabase = await createClient()

  // Récupérer le propriétaire
  const { data: owner, error } = await supabase
    .from("owners")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !owner) {
    notFound()
  }

  // Récupérer les lofts de ce propriétaire
  const { data: lofts } = await supabase
    .from("lofts")
    .select("id, name, address, price_per_night, status")
    .eq("new_owner_id", id)

  const ownerLofts = lofts || []
  const totalMonthlyValue = ownerLofts.reduce((sum, loft) => sum + (loft.price_per_night || 0) * 30, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/${locale}/owners`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux propriétaires
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {owner.name || owner.business_name || 'Propriétaire'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations du propriétaire */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte d'informations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Informations</h2>
            <div className="space-y-4">
              {owner.email && (
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{owner.email}</p>
                  </div>
                </div>
              )}
              
              {owner.phone && (
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="text-gray-900">{owner.phone}</p>
                  </div>
                </div>
              )}
              
              {owner.address && (
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="text-gray-900">{owner.address}</p>
                  </div>
                </div>
              )}
              
              {owner.business_name && (
                <div className="flex items-start">
                  <Building2 className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Entreprise</p>
                    <p className="text-gray-900">{owner.business_name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Membre depuis</p>
                  <p className="text-gray-900">
                    {new Date(owner.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des lofts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Lofts ({ownerLofts.length})
            </h2>
            {ownerLofts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun loft associé à ce propriétaire
              </p>
            ) : (
              <div className="space-y-3">
                {ownerLofts.map((loft) => (
                  <Link
                    key={loft.id}
                    href={`/${locale}/lofts/${loft.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{loft.name}</h3>
                        {loft.address && (
                          <p className="text-sm text-gray-500 mt-1">{loft.address}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {loft.price_per_night?.toLocaleString()} DZD
                        </p>
                        <p className="text-xs text-gray-500">par nuit</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nombre de lofts</p>
                <p className="text-3xl font-bold text-gray-900">{ownerLofts.length}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Valeur mensuelle totale</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalMonthlyValue.toLocaleString()} DZD
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  owner.verification_status === 'verified' 
                    ? 'bg-green-100 text-green-800'
                    : owner.verification_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {owner.verification_status === 'verified' ? 'Vérifié' : 
                   owner.verification_status === 'pending' ? 'En attente' : 
                   owner.verification_status || 'Non vérifié'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/${locale}/owners/${id}/edit`}
                className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
              >
                Modifier
              </Link>
              <Link
                href={`/${locale}/lofts/new?owner_id=${id}`}
                className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
              >
                Ajouter un loft
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
