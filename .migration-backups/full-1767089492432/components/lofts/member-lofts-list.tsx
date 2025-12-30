"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import { 
  Eye, 
  Search, 
  Filter, 
  MapPin, 
  Home, 
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RoleBasedAccess } from "@/components/auth/role-based-access"
import { MemberLoftAccessNotice } from "@/components/lofts/restricted-loft-info"
import type { MemberLoftView, MemberTaskView } from "@/lib/types/member-views"
import type { UserRole } from "@/lib/types"

interface MemberLoftsListProps {
  /** Member's accessible lofts */
  lofts: MemberLoftView[]
  /** Member's tasks for context */
  tasks: MemberTaskView[]
  /** Current user role */
  userRole: UserRole
  /** Member user ID */
  userId: string
}

export function MemberLoftsList({
  lofts,
  tasks,
  userRole,
  userId
}: MemberLoftsListProps) {
  const locale = useLocale()
  const t = useTranslations('lofts')
  const tCommon = useTranslations('common')
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [taskFilter, setTaskFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter lofts based on member criteria
  const filteredLofts = lofts.filter((loft) => {
    const matchesSearch = 
      loft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loft.address?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || loft.status === statusFilter
    
    const matchesTaskFilter = 
      taskFilter === "all" ||
      (taskFilter === "with_tasks" && loft.hasActiveTasks) ||
      (taskFilter === "no_tasks" && !loft.hasActiveTasks)

    return matchesSearch && matchesStatus && matchesTaskFilter
  })

  // Pagination
  const totalPages = Math.ceil(filteredLofts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLofts = filteredLofts.slice(startIndex, startIndex + itemsPerPage)

  // Get status badge for member view (no financial info)
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: t('available'), className: "bg-green-100 text-green-800 hover:bg-green-200" },
      occupied: { label: t('occupied'), className: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
      maintenance: { label: t('maintenance'), className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  // Get task status badge
  const getTaskStatusBadge = (loft: MemberLoftView) => {
    if (!loft.hasActiveTasks) {
      return (
        <Badge variant="outline" className="text-gray-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('noActiveTasks')}
        </Badge>
      )
    }

    return (
      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
        <Clock className="w-3 h-3 mr-1" />
        {loft.assignedTasksCount} {loft.assignedTasksCount === 1 ? t('task') : t('tasks')}
      </Badge>
    )
  }

  return (
    <RoleBasedAccess 
      userRole={userRole} 
      allowedRoles={['member']}
      fallback={
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>{t('accessDenied')}</p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Member access notice */}
        <MemberLoftAccessNotice />
        
        {/* Header with search and info */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('myLofts')}</h2>
            <p className="text-gray-600">
              {filteredLofts.length} {filteredLofts.length === 1 ? t('loft') : t('lofts')} {t('accessible')}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {t('onlyShowingAssignedLofts')}
            </p>
          </div>
          
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 lg:w-auto w-full">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('searchMyLofts')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Member-specific filters */}
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
            </SelectContent>
          </Select>

          <Select value={taskFilter} onValueChange={setTaskFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('filterByTasks')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon('allLofts')}</SelectItem>
              <SelectItem value="with_tasks">{t('withActiveTasks')}</SelectItem>
              <SelectItem value="no_tasks">{t('noActiveTasks')}</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== "all" || taskFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setTaskFilter("all")
                setCurrentPage(1)
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {tCommon('clearFilters')}
            </Button>
          )}
        </div>

        {/* Member lofts table (no financial data) */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">{t('name')}</TableHead>
                <TableHead className="font-semibold">{t('address')}</TableHead>
                <TableHead className="font-semibold">{t('status')}</TableHead>
                <TableHead className="font-semibold">{t('zone')}</TableHead>
                <TableHead className="font-semibold">{t('myTasks')}</TableHead>
                <TableHead className="font-semibold text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLofts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
                        {loft.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(loft.status)}
                    </TableCell>
                    <TableCell>
                      {loft.zone_area_name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {getTaskStatusBadge(loft)}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Members can only view, no edit/delete access */}
                      <RoleBasedAccess 
                        userRole={userRole} 
                        allowedRoles={['member']}
                        showFallback={false}
                      >
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${locale}/lofts/${loft.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            {tCommon('view')}
                          </Link>
                        </Button>
                      </RoleBasedAccess>
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

        {/* Security notice for members */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-full">
              <AlertCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                {t('memberViewNotice')}
              </h4>
              <p className="text-sm text-blue-700">
                {t('memberViewDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleBasedAccess>
  )
}