"use client"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, DollarSign, Star, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { getColumns } from "../columns"
import { Currency } from "@/lib/types"
import { useTranslations, useLocale } from 'next-intl';
import { getCurrencySymbol } from '@/utils/currency-formatter';

interface CurrencyClientProps {
  data: Currency[]
  onSetDefault: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export const CurrencyClient = ({ data, onSetDefault, onDelete }: CurrencyClientProps) => {
  const t = useTranslations('settings');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter()

  const defaultCurrency = data.find(currency => currency.is_default)
  const otherCurrencies = data.filter(currency => !currency.is_default)

  const handleEdit = (id: string) => {
    router.push(`/${locale}/settings/currencies/${id}/edit`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
            <span>{tNav('currencies')}</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base" id="currencies-subtitle">{t('currencies.subtitle')}</p>
        </div>
        <Button onClick={() => router.push(`/${locale}/settings/currencies/new`)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('currencies.addNew')}
        </Button>
      </div>

      {/* Default Currency Card */}
      {defaultCurrency && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-primary">
              <div className="p-2 rounded-full bg-primary/10 animate-pulse">
                <Star className="h-5 w-5" />
              </div>
              {t('currencies.defaultCurrency')}
            </CardTitle>
            <CardDescription className="text-primary/70">
              {t('currencies.defaultCurrencyDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100">{defaultCurrency.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {defaultCurrency.code} • {getCurrencySymbol(defaultCurrency.code as any, locale as any)}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80 text-white border-0 px-3 sm:px-4 py-1 sm:py-2 self-start sm:self-center">
                <Star className="h-3 w-3 mr-1" />
                {t('currencies.default')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Currencies */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('currencies.allCurrencies')}
          </CardTitle>
          <CardDescription>
            {t('currencies.totalCurrencies', { count: data.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg mb-2">
                {t('currencies.noCurrenciesFound')}
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                {t('currencies.addFirstCurrency')}
              </p>
              <Button onClick={() => router.push(`/${locale}/settings/currencies/new`)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('currencies.addNew')}
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <DataTable
                key={data.length}
                columns={getColumns(onSetDefault, onDelete, handleEdit, router, t, locale)}
                data={data}
                searchPlaceholder={t('currencies.searchCurrencies') || "Search currencies..."}
                searchKeys={['name', 'code', 'symbol']}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}