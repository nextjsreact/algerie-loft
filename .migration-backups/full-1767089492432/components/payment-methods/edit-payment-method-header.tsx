"use client"

import { useTranslations } from "next-intl"
import { CreditCard } from "lucide-react"

export function EditPaymentMethodHeader() {
  const t = useTranslations('paymentMethods')

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
      <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
      
      <div className="relative flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
          <CreditCard className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {t('editPaymentMethod')}
          </h1>
          <p className="text-green-100 text-lg font-medium mt-1">
            {t('updatePaymentMethodInfo')}
          </p>
        </div>
      </div>
    </div>
  )
}