"use client"

import { AlertCircle, Lock, Eye } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserRole } from "@/lib/types"

interface RestrictedLoftInfoProps {
  /** Current user role */
  userRole: UserRole
  /** Type of restriction */
  restrictionType?: 'financial' | 'owner' | 'full_access'
  /** Optional message to display */
  message?: string
  /** Whether to show upgrade suggestion */
  showUpgrade?: boolean
}

export function RestrictedLoftInfo({
  userRole,
  restrictionType = 'financial',
  message,
  showUpgrade = false
}: RestrictedLoftInfoProps) {
  const t = useTranslations('lofts')
  
  const getRestrictionConfig = () => {
    switch (restrictionType) {
      case 'financial':
        return {
          icon: <Lock className="w-8 h-8 text-amber-500" />,
          title: t('financialDataRestricted'),
          description: t('financialDataRestrictedDescription'),
          bgColor: 'from-amber-50 to-yellow-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        }
      case 'owner':
        return {
          icon: <Eye className="w-8 h-8 text-blue-500" />,
          title: t('ownerInfoRestricted'),
          description: t('ownerInfoRestrictedDescription'),
          bgColor: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        }
      case 'full_access':
      default:
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          title: t('accessRestricted'),
          description: t('accessRestrictedDescription'),
          bgColor: 'from-red-50 to-pink-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        }
    }
  }

  const config = getRestrictionConfig()

  return (
    <Card className={`bg-gradient-to-br ${config.bgColor} ${config.borderColor} shadow-sm`}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-white/50 rounded-full">
            {config.icon}
          </div>
        </div>
        <CardTitle className={`text-lg ${config.textColor}`}>
          {config.title}
        </CardTitle>
        <CardDescription className={config.textColor}>
          {message || config.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        <div className={`text-sm ${config.textColor} mb-4`}>
          <p className="font-medium mb-2">
            {t('currentRole')}: <span className="capitalize">{userRole}</span>
          </p>
          <p>
            {t('requiredRoles')}: {t('adminManagerExecutive')}
          </p>
        </div>

        {showUpgrade && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              {t('contactAdminForAccess')}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className={`${config.textColor} border-current hover:bg-white/50`}
            >
              {t('requestAccess')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Inline restricted info component for table cells
 */
interface InlineRestrictedInfoProps {
  userRole: UserRole
  type?: 'price' | 'owner' | 'sensitive'
}

export function InlineRestrictedInfo({ 
  userRole, 
  type = 'sensitive' 
}: InlineRestrictedInfoProps) {
  const t = useTranslations('lofts')
  
  const getConfig = () => {
    switch (type) {
      case 'price':
        return {
          icon: <Lock className="w-3 h-3" />,
          text: t('priceHidden'),
          className: 'text-amber-600 bg-amber-50 border-amber-200'
        }
      case 'owner':
        return {
          icon: <Eye className="w-3 h-3" />,
          text: t('ownerHidden'),
          className: 'text-blue-600 bg-blue-50 border-blue-200'
        }
      default:
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: t('restricted'),
          className: 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }
  }

  const config = getConfig()

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.text}
    </div>
  )
}

/**
 * Member-specific loft access notice
 */
export function MemberLoftAccessNotice() {
  const t = useTranslations('lofts')
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-1 bg-blue-100 rounded-full flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            {t('memberAccessNotice')}
          </h4>
          <p className="text-sm text-blue-700">
            {t('memberAccessDescription')}
          </p>
          <ul className="mt-2 text-xs text-blue-600 space-y-1">
            <li>• {t('onlyAssignedLofts')}</li>
            <li>• {t('noFinancialData')}</li>
            <li>• {t('noOwnerInfo')}</li>
            <li>• {t('operationalInfoOnly')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}