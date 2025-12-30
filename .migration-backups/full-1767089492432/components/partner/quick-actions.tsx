'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Building2, Calendar, FileText, Loader2 } from 'lucide-react'
import { useState, useCallback, useMemo, memo } from 'react'
import { cn } from '@/lib/utils'

interface QuickActionsProps {
  locale: string
}

/**
 * Optimized QuickActions component with React.memo, useMemo, and useCallback
 * Only re-renders when locale changes
 */
export const QuickActions = memo(function QuickActions({ locale }: QuickActionsProps) {
  const router = useRouter()
  const t = useTranslations('partner.dashboard.actions')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // Memoize action handler to prevent recreation on every render
  const handleAction = useCallback(async (href: string, actionKey: string) => {
    setLoadingAction(actionKey)
    try {
      router.push(href)
    } finally {
      // Reset loading state after navigation starts
      setTimeout(() => setLoadingAction(null), 500)
    }
  }, [router])

  // Memoize actions array to prevent recreation on every render
  const actions = useMemo(() => [
    {
      key: 'addProperty',
      label: t('addProperty'),
      icon: Plus,
      href: `/${locale}/partner/properties/new`,
      variant: 'default' as const,
    },
    {
      key: 'manageProperties',
      label: t('manageProperties'),
      icon: Building2,
      href: `/${locale}/partner/properties`,
      variant: 'outline' as const,
    },
    {
      key: 'viewCalendar',
      label: t('viewCalendar'),
      icon: Calendar,
      href: `/${locale}/partner/calendar`,
      variant: 'outline' as const,
    },
    {
      key: 'financialReports',
      label: t('financialReports'),
      icon: FileText,
      href: `/${locale}/partner/earnings`,
      variant: 'outline' as const,
    },
  ], [locale, t])

  return (
    <Card className="mb-8 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl" id="quick-actions-title">
          {t('quickActions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3"
          role="group"
          aria-labelledby="quick-actions-title"
        >
          {actions.map((action) => {
            const isLoading = loadingAction === action.key
            return (
              <Button
                key={action.key}
                variant={action.variant}
                onClick={() => handleAction(action.href, action.key)}
                disabled={isLoading}
                aria-label={action.label}
                aria-busy={isLoading}
                className={cn(
                  "flex items-center justify-center gap-2 transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  "w-full sm:w-auto",
                  "min-h-[44px]", // WCAG touch target size
                  isLoading && "cursor-wait"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <action.icon className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="text-sm md:text-base">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})
