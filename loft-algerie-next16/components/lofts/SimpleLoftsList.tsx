"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { 
  Search, 
  Filter, 
  MapPin, 
  Home, 
  DollarSign,
  User,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

// Types simplifiés pour commencer
interface SimpleLoft {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'maintenance' | 'unavailable'
  price_per_night: number
  rooms: number
  owner_name?: string
  zone_area_name?: string
}

interface SimpleLoftsListProps {
  lofts: SimpleLoft[]
}

export function SimpleLoftsList({ lofts }: SimpleLoftsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  
  const itemsPerPage = 9

  // Get unique owners for filter
  const uniqueOwners = Array.from(new Set(lofts.map(loft => loft.owner_name).filter(Boolean)))

  // Filtrage des lofts
  const filteredLofts = lofts.filter((loft) => {
    const matchesSearch = 
      loft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loft.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loft.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loft.zone_area_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || loft.status === statusFilter
    const matchesOwner = ownerFilter === "all" || loft.owner_name === ownerFilter

    return matchesSearch && matchesStatus && matchesOwner
  })

  // Pagination
  const totalPages = Math.ceil(filteredLofts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLofts = filteredLofts.slice(startIndex, startIndex + itemsPerPage)

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: "Disponible", className: "bg-green-100 text-green-800" },
      occupied: { label: "Occupé", className: "bg-blue-100 text-blue-800" },
      maintenance: { label: "Maintenance", className: "bg-yellow-100 text-yellow-800" },
      unavailable: { label: "Indisponible", className: "bg-red-100 text-red-800" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Liste des Lofts</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredLofts.length} loft{filteredLofts.length !== 1 ? 's' : ''} trouvé{filteredLofts.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Barre de recherche et contrôles */}
        <div className="flex flex-col sm:flex-row gap-3 lg:w-auto w-full">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher des lofts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              🏠 Grille
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              📋 Table
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="available">Disponible</option>
          <option value="occupied">Occupé</option>
          <option value="maintenance">Maintenance</option>
          <option value="unavailable">Indisponible</option>
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tous les propriétaires</option>
          {uniqueOwners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>

        {(searchTerm || statusFilter !== "all" || ownerFilter !== "all") && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setOwnerFilter("all")
              setCurrentPage(1)
            }}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {/* Vue Grille ou Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLofts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <span className="text-4xl">🏠</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Aucun loft trouvé</p>
            </div>
          ) : (
            paginatedLofts.map((loft) => (
              <Card key={loft.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{loft.name}</CardTitle>
                    {getStatusBadge(loft.status)}
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {loft.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Prix/nuit:
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {formatPrice(loft.price_per_night)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        Chambres:
                      </span>
                      <span className="font-medium">{loft.rooms}</span>
                    </div>
                    
                    {loft.owner_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Propriétaire:
                        </span>
                        <span className="font-medium">{loft.owner_name}</span>
                      </div>
                    )}
                    
                    {loft.zone_area_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Zone:</span>
                        <span className="font-medium">{loft.zone_area_name}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      {loft.status === 'available' && (
                        <Button size="sm" className="flex-1">
                          Réserver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Vue Table */
        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Loft
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Prix/nuit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLofts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Home className="h-8 w-8 text-gray-300" />
                        <p>Aucun loft trouvé</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLofts.map((loft) => (
                    <tr key={loft.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {loft.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {loft.address}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(loft.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {loft.owner_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {formatPrice(loft.price_per_night)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {loft.zone_area_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Affichage {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredLofts.length)} sur {filteredLofts.length} résultats
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bouton pour ajouter un nouveau loft */}
      <div className="text-center">
        <Button size="lg">
          ➕ Ajouter un nouveau loft
        </Button>
      </div>
    </div>
  )
}