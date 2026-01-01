"use client"

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
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
              <p className="text-2xl font-bold text-purple-700">{formatCurrencyAuto(totalRevenue, 'DZD', `/${locale}/lofts`)}</p>
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
}