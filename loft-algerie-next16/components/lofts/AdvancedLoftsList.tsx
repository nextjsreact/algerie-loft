"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { 
  Search, 
  Filter, 
  MapPin, 
  Home, 
  DollarSign,
  User,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Plus
} from "lucide-react"

// Types pour les lofts
interface AdvancedLoft {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'maintenance' | 'unavailable'
  price_per_night: number
  rooms: number
  owner_name?: string
  zone_area_name?: string
  created_at?: string
  last_booking?: string
}

interface Owner {
  id: string
  name: string
}

interface ZoneArea {
  id: string
  name: string
}

interface AdvancedLoftsListProps {
  lofts: AdvancedLoft[]
  owners?: Owner[]
  zoneAreas?: ZoneArea[]
  isAdmin?: boolean
  onEdit?: (loftId: string) => void
  onDelete?: (loftId: string) => void
  onView?: (loftId: string) => void
  onBook?: (loftId: string) => void
}

export function AdvancedLoftsList({ 
  lofts, 
  owners = [], 
  zoneAreas = [], 
  isAdmin = true,
  onEdit,
  onDelete,
  onView,
  onBook
}: AdvancedLoftsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  
  const itemsPerPage = 10

  // Filtrage des lofts
  const filteredLofts = lofts.filter((loft) => {
    const matchesSearch = 
      loft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loft.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loft.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || loft.status === statusFilter
    const matchesOwner = ownerFilter === "all" || loft.owner_name === ownerFilter
    const matchesZone = zoneFilter === "all" || loft.zone_area_name === zoneFilter

    return matchesSearch && matchesStatus && matchesOwner && matchesZone
  })

  // Pagination
  const totalPages = Math.ceil(filteredLofts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLofts = filteredLofts.slice(startIndex, startIndex + itemsPerPage)

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: "Disponible", className: "bg-green-100 text-green-800 hover:bg-green-200" },
      occupied: { label: "Occupé", className: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
      maintenance: { label: "Maintenance", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
      unavailable: { label: "Indisponible", className: "bg-red-100 text-red-800 hover:bg-red-200" }
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

  // Fonction pour réinitialiser les filtres
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setOwnerFilter("all")
    setZoneFilter("all")
    setCurrentPage(1)
  }

  // Statistiques rapides
  const stats = {
    total: lofts.length,
    available: lofts.filter(l => l.status === 'available').length,
    occupied: lofts.filter(l => l.status === 'occupied').length,
    maintenance: lofts.filter(l => l.status === 'maintenance').length,
    avgPrice: Math.round(lofts.reduce((sum, loft) => sum + loft.price_per_night, 0) / lofts.length)
  }

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              <p className="text-sm text-gray-600">Disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.occupied}</p>
              <p className="text-sm text-gray-600">Occupés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
              <p className="text-sm text-gray-600">Maintenance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.avgPrice / 1000}K</p>
              <p className="text-sm text-gray-600">Prix moyen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* En-tête avec titre et contrôles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Lofts</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredLofts.length} loft{filteredLofts.length !== 1 ? 's' : ''} trouvé{filteredLofts.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Tableau
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cartes
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Loft
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher des lofts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="occupied">Occupé</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="unavailable">Indisponible</SelectItem>
                </SelectContent>
              </Select>

              {owners.length > 0 && (
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Propriétaire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les propriétaires</SelectItem>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.name}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {zoneAreas.length > 0 && (
                <Select value={zoneFilter} onValueChange={setZoneFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les zones</SelectItem>
                    {zoneAreas.map((zone) => (
                      <SelectItem key={zone.id} value={zone.name}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(searchTerm || statusFilter !== "all" || ownerFilter !== "all" || zoneFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="font-semibold">Nom</TableHead>
                  <TableHead className="font-semibold">Adresse</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="font-semibold">Propriétaire</TableHead>
                  <TableHead className="font-semibold">Zone</TableHead>
                  <TableHead className="font-semibold">Prix/nuit</TableHead>
                  <TableHead className="font-semibold">Chambres</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLofts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Home className="h-8 w-8 text-gray-300" />
                        <p>Aucun loft trouvé</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLofts.map((loft) => (
                    <TableRow key={loft.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          {loft.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          {loft.address || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(loft.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4" />
                          {loft.owner_name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {loft.zone_area_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <DollarSign className="h-4 w-4" />
                          {formatPrice(loft.price_per_night)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {loft.rooms}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView?.(loft.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {loft.status === 'available' && (
                              <DropdownMenuItem onClick={() => onBook?.(loft.id)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Réserver
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => onEdit?.(loft.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onDelete?.(loft.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Vue en cartes
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedLofts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <span className="text-4xl">🏠</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Aucun loft trouvé</p>
            </div>
          ) : (
            paginatedLofts.map((loft) => (
              <Card key={loft.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{loft.name}</CardTitle>
                    {getStatusBadge(loft.status)}
                  </div>
                  <CardDescription>
                    📍 {loft.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Prix/nuit:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {formatPrice(loft.price_per_night)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Chambres:</span>
                      <span className="font-medium">{loft.rooms}</span>
                    </div>
                    
                    {loft.owner_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Propriétaire:</span>
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
                      <Button size="sm" className="flex-1" onClick={() => onView?.(loft.id)}>
                        Voir détails
                      </Button>
                      {loft.status === 'available' && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => onBook?.(loft.id)}>
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
    </div>
  )
}