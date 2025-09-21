"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import { 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  MapPin, 
  Home, 
  DollarSign,
  User,
  Calendar,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { RoleBasedAccess } from "@/components/auth/role-based-access"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { LoftWithRelations, LoftOwner, ZoneArea, UserRole } from "@/lib/types"
import { formatCurrencyAuto } from "@/utils/currency-formatter"

interface LoftsListProps {
  lofts: LoftWithRelations[]
  owners: LoftOwner[]
  zoneAreas: ZoneArea[]
  isAdmin: boolean
  userRole?: UserRole
}

export function LoftsList({
  lofts,
  owners,
  zoneAreas,
  isAdmin,
  userRole = 'admin'
}: LoftsListProps) {
  const locale = useLocale()
  const t = useTranslations('lofts')
  const tCommon = useTranslations('common')
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtrage des lofts
  const filteredLofts = lofts.filter((loft) => {
    const matchesSearch = 
      loft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loft.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loft.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || loft.status === statusFilter
    const matchesOwner = ownerFilter === "all" || loft.owner_id === ownerFilter
    const matchesZone = zoneFilter === "all" || loft.zone_area_id === zoneFilter

    return matchesSearch && matchesStatus && matchesOwner && matchesZone
  })

  // Pagination
  const totalPages = Math.ceil(filteredLofts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLofts = filteredLofts.slice(startIndex, startIndex + itemsPerPage)

  // Debug: Log the first few lofts to see their data structure
  console.log('Lofts data sample:', paginatedLofts.slice(0, 3).map(loft => ({
    id: loft.id,
    name: loft.name,
    price_per_month: loft.price_per_month,
    price_per_month_type: typeof loft.price_per_month,
    price_per_night: (loft as any).price_per_night,
    price_per_night_type: typeof (loft as any).price_per_night
  })))

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: t('available'), className: "bg-green-100 text-green-800 hover:bg-green-200" },
      occupied: { label: t('occupied'), className: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
      maintenance: { label: t('maintenance'), className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
      unavailable: { label: t('unavailable'), className: "bg-red-100 text-red-800 hover:bg-red-200" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  // Fonction pour formater le prix
  const formatPrice = (price: number | null) => {
    console.log('formatPrice called with:', price, 'Type:', typeof price)
    if (!price || price === null || price === undefined) {
      console.log('Price is null/undefined, returning N/A')
      return "N/A"
    }
    return formatCurrencyAuto(price, 'DZD', `/${locale}/lofts`)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et filtres */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('loftsList')}</h2>
          <p className="text-gray-600">
            {filteredLofts.length} {filteredLofts.length === 1 ? t('loft') : t('lofts')} {t('found')}
          </p>
        </div>
        
        {/* Barre de recherche */}
        <div className="flex flex-col sm:flex-row gap-3 lg:w-auto w-full">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('searchLofts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            <SelectItem value="available">{t('available')}</SelectItem>
            <SelectItem value="occupied">{t('occupied')}</SelectItem>
            <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
            <SelectItem value="unavailable">{t('unavailable')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('filterByOwner')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('allOwners')}</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('filterByZone')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('allZones')}</SelectItem>
            {zoneAreas.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchTerm || statusFilter !== "all" || ownerFilter !== "all" || zoneFilter !== "all") && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setOwnerFilter("all")
              setZoneFilter("all")
              setCurrentPage(1)
            }}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {tCommon('clearFilters')}
          </Button>
        )}
      </div>

      {/* Tableau des lofts */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">{t('name')}</TableHead>
              <TableHead className="font-semibold">{t('address')}</TableHead>
              <TableHead className="font-semibold">{t('statusTitle')}</TableHead>
              <RoleBasedAccess 
                userRole={userRole} 
                allowedRoles={['admin', 'manager', 'executive']}
                showFallback={false}
              >
                <TableHead className="font-semibold">{t('owner')}</TableHead>
              </RoleBasedAccess>
              <TableHead className="font-semibold">{t('zone')}</TableHead>
              <RoleBasedAccess 
                userRole={userRole} 
                allowedRoles={['admin', 'manager', 'executive']}
                showFallback={false}
              >
                <TableHead className="font-semibold">{t('price')}</TableHead>
              </RoleBasedAccess>
              <TableHead className="font-semibold">{t('rooms')}</TableHead>
              <TableHead className="font-semibold text-right">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLofts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Home className="h-8 w-8 text-gray-300" />
                    <p>{t('noLoftsFound')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLofts.map((loft) => (
                <TableRow key={loft.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      {loft.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {loft.address || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(loft.status)}
                  </TableCell>
                  <RoleBasedAccess 
                    userRole={userRole} 
                    allowedRoles={['admin', 'manager', 'executive']}
                    showFallback={false}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        {loft.owner_name || "N/A"}
                      </div>
                    </TableCell>
                  </RoleBasedAccess>
                  <TableCell>
                    {loft.zone_area_name || "N/A"}
                  </TableCell>
                  <RoleBasedAccess 
                    userRole={userRole} 
                    allowedRoles={['admin', 'manager', 'executive']}
                    showFallback={false}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        {formatPrice(loft.price_per_month || 0)}
                      </div>
                    </TableCell>
                  </RoleBasedAccess>
                  <TableCell>
                    {"N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/lofts/${loft.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            {tCommon('view')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/lofts/${loft.id}/edit`} className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            {tCommon('edit')}
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            {tCommon('delete')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {tCommon('showing')} {startIndex + 1} {tCommon('to')} {Math.min(startIndex + itemsPerPage, filteredLofts.length)} {tCommon('of')} {filteredLofts.length} {tCommon('results')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {tCommon('previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {tCommon('page')} {currentPage} {tCommon('of')} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {tCommon('next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}