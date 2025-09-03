"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Users, Building2, Mail, Phone, MapPin, Trash2, Edit, Eye, DollarSign } from "lucide-react"
import Link from "next/link"
import { deleteOwner } from "@/app/actions/owners"
import type { LoftOwner } from "@/lib/types"

interface Owner extends LoftOwner {
  loft_count: string
  total_monthly_value: string
}

interface OwnersWrapperProps {
  owners: Owner[]
}

export function OwnersWrapper({ owners }: OwnersWrapperProps) {
  const t = useTranslations("owners")

  const getOwnershipColor = (type: string) => {
    return type === "company" 
      ? "bg-blue-100 text-blue-800 border-blue-200" 
      : "bg-green-100 text-green-800 border-green-200"
  }

  const getOwnershipIcon = (type: string) => {
    return type === "company" ? Building2 : Users
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
        
        <Button 
          asChild 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Link href="/owners/new" className="flex items-center gap-2 px-6 py-3">
            <Plus className="h-5 w-5" />
            <span className="font-medium">{t('addOwner')}</span>
          </Link>
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('totalOwners')}</p>
                <p className="text-3xl font-bold text-gray-900">{owners.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('totalProperties')}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {owners.reduce((total, owner) => total + parseInt(owner.loft_count), 0)}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('totalMonthlyValue')}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {owners.reduce((total, owner) => total + parseFloat(owner.total_monthly_value), 0).toLocaleString()} DZD
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des propriétaires */}
      {owners.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('noOwnersFound')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('noOwnersDescription')}
            </p>
            <Button asChild>
              <Link href="/owners/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('addFirstOwner')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {owners.map((owner) => {
            const OwnershipIcon = getOwnershipIcon(owner.ownership_type)
            
            return (
              <Card key={owner.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <OwnershipIcon className="h-5 w-5 text-gray-600" />
                        {owner.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {t('propertiesCount', { count: parseInt(owner.loft_count) })} • 
                        <span className="font-medium text-green-600 ml-1">
                          {parseFloat(owner.total_monthly_value).toLocaleString()} DZD/mois
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getOwnershipColor(owner.ownership_type)}>
                      {owner.ownership_type === "company" 
                        ? t('company') 
                        : t('thirdParty')
                      }
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Informations de contact */}
                  <div className="space-y-3">
                    {owner.email && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{owner.email}</span>
                      </div>
                    )}
                    
                    {owner.phone && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{owner.phone}</span>
                      </div>
                    )}
                    
                    {owner.address && (
                      <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{owner.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Link href={`/owners/${owner.id}`} className="flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{t('view')}</span>
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="flex-1 hover:bg-gray-50 hover:border-gray-300"
                    >
                      <Link href={`/owners/${owner.id}/edit`} className="flex items-center justify-center gap-2">
                        <Edit className="h-4 w-4" />
                        <span>{t('edit')}</span>
                      </Link>
                    </Button>
                    
                    <form 
                      action={async () => {
                        if (confirm(t('deleteOwnerConfirm'))) {
                          await deleteOwner(owner.id)
                        }
                      }}
                      className="flex-1"
                    >
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{t('delete')}</span>
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}