'use client'

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { useTranslations } from "next-intl"
import { Building2, Shield } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Section - Compact */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Loft Management System
          </h1>

          <div className="w-16 h-1 bg-blue-600 dark:bg-blue-400 mx-auto mb-3 rounded-full"></div>

          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {t('passwordReset.subtitle')}
          </p>
        </div>

        {/* Main Form Card - Compact */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
          <ForgotPasswordForm />
        </div>

        {/* Footer - Minimal */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span>Secure Connection</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t('passwordReset.footerText')}
          </p>
        </div>
      </div>
    </div>
  )
}
