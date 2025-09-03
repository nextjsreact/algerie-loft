"use client"

import { useTranslations } from "next-intl"
import { ExecutiveDashboard } from "@/components/executive/executive-dashboard"

interface ExecutiveWrapperProps {
  metrics?: any
  error?: boolean
}

export function ExecutiveWrapper({ metrics, error = false }: ExecutiveWrapperProps) {
  const t = useTranslations("executive");

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t('accessDenied')}</h1>
          <p className="text-slate-600 mb-4">
            {t('accessDeniedDesc')}
          </p>
          <p className="text-sm text-slate-500">
            {t('executiveLevelRequired')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                {t('title')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {t('confidential')}
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {t('executiveOnly')}
              </div>
            </div>
          </div>
        </div>
        
        <ExecutiveDashboard metrics={metrics} />
      </div>
    </div>
  )
}