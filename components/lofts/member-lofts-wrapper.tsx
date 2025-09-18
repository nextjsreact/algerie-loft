"use client"

import { useTranslations, useLocale } from 'next-intl'
import { Home, MapPin, CheckCircle, AlertCircle } from "lucide-react"
import { RoleBasedAccess } from "@/components/auth/role-based-access"
import { MemberLoftsList } from "@/components/lofts/member-lofts-list"
import type { MemberLoftView, MemberTaskView } from "@/lib/types/member-views"
import type { UserRole } from "@/lib/types"

interface MemberLoftsWrapperProps {
  /** Member's accessible lofts (already filtered) */
  lofts: MemberLoftView[]
  /** Member's tasks for context */
  tasks: MemberTaskView[]
  /** Current user role */
  userRole: UserRole
  /** Member user ID */
  userId: string
}

export function MemberLoftsWrapper({
  lofts,
  tasks,
  userRole,
  userId
}: MemberLoftsWrapperProps) {
  const locale = useLocale()
  const t = useTranslations('lofts')
  
  // Calculate statistics for member view
  const stats = {
    totalLofts: lofts.length,
    loftsWithActiveTasks: lofts.filter(loft => loft.hasActiveTasks).length,
    loftsNeedingMaintenance: lofts.filter(loft => loft.status === 'maintenance').length,
    totalAssignedTasks: lofts.reduce((sum, loft) => sum + (loft.assignedTasksCount || 0), 0)
  }

  return (
    <RoleBasedAccess 
      userRole={userRole} 
      allowedRoles={['member']}
      fallback={
        <div className="text-center py-16 bg-white rounded-3xl shadow-lg border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h3>
            <p className="text-gray-600">
              This view is only available to team members with assigned tasks.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Member-specific header */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-90"></div>
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
                  <Home className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {t('myAssignedLofts')}
              </h1>
              <p className="text-xl text-blue-100 mb-4 max-w-2xl mx-auto">
                {t('memberLoftsDescription')}
              </p>
              <p className="text-blue-200 text-sm">
                {t('showingOnlyAssignedLofts')}
              </p>
            </div>
          </div>
        </div>

        {/* Member statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('accessibleLofts')}</p>
                <p className="text-3xl font-bold text-blue-700">{stats.totalLofts}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t('withActiveTasks')}</p>
                <p className="text-3xl font-bold text-green-700">{stats.loftsWithActiveTasks}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">{t('needingMaintenance')}</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.loftsNeedingMaintenance}</p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">{t('totalTasks')}</p>
                <p className="text-3xl font-bold text-purple-700">{stats.totalAssignedTasks}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Message if no accessible lofts */}
        {lofts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-lg border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Home className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('noAssignedLofts')}</h3>
              <p className="text-gray-600 mb-4">
                {t('noTasksAssignedYet')}
              </p>
              <p className="text-sm text-gray-500">
                {t('contactSupervisorForTasks')}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <MemberLoftsList
              lofts={lofts}
              tasks={tasks}
              userRole={userRole}
              userId={userId}
            />
          </div>
        )}
      </div>
    </RoleBasedAccess>
  )
}