"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoriesList } from "@/components/settings/categories-list"
import { Plus, Tag, TrendingUp, TrendingDown, Sparkles, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"
import type { Category } from "@/lib/types"

interface CategoriesWrapperProps {
  categories: Category[]
}

export function CategoriesWrapper({ categories }: CategoriesWrapperProps) {
  const t = useTranslations("settings");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const incomeCategories = categories.filter(cat => cat.type === 'income')
  const expenseCategories = categories.filter(cat => cat.type === 'expense')

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-700">
      {/* Header avec gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50"></div>
        <div className="absolute top-4 right-4 opacity-10">
          <Sparkles className="h-32 w-32 text-primary" />
        </div>
        <div className="relative flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                <Tag className="h-8 w-8 text-primary" />
              </div>
              {tNav('categories')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">{t('categories.subtitle')}</p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t('categories.incomeCount', { count: incomeCategories.length })}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t('categories.expenseCount', { count: expenseCategories.length })}
                </span>
              </div>
            </div>
          </div>
          <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 h-auto">
            <Link href={`/${locale}/settings/categories/new`}>
              <Plus className="mr-2 h-5 w-5" />
              {t('categories.addNew')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards avec animations améliorées */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="group border-0 bg-gradient-to-br from-green-50 via-green-50/80 to-emerald-50/60 dark:from-green-950/30 dark:via-green-900/20 dark:to-emerald-900/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
            <TrendingUp className="h-24 w-24 text-green-500" />
          </div>
          <CardHeader className="pb-6 relative">
            <CardTitle className="flex items-center gap-4 text-green-700 dark:text-green-400 text-xl">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-200 to-green-100 dark:from-green-800 dark:to-green-900 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <TrendingUp className="h-6 w-6" />
              </div>
              {t('categories.incomeCategories')}
            </CardTitle>
            <CardDescription className="text-green-600/80 dark:text-green-400/80 text-base">
              {t('categories.manageCategoriesIncome')}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {incomeCategories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-4">
                    <TrendingUp className="h-12 w-12 text-green-400" />
                  </div>
                  <p className="text-muted-foreground text-base mb-2">
                    {t('categories.noIncomeCategories')}
                  </p>
                  <Button asChild variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                    <Link href={`/${locale}/settings/categories/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('categories.addNew')}
                    </Link>
                  </Button>
                </div>
              ) : (
                incomeCategories.map((category, index) => (
                  <div 
                    key={category.id} 
                    className="group/item flex items-center justify-between p-4 rounded-2xl bg-white/90 dark:bg-gray-800/60 border border-green-100 dark:border-green-800/30 hover:shadow-lg hover:bg-white dark:hover:bg-gray-800 hover:border-green-200 dark:hover:border-green-700 transition-all duration-300 hover:scale-[1.02]"
                    style={{ 
                      animationDelay: `${index * 150}ms`,
                      animation: 'slideInUp 0.6s ease-out forwards'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-sm"></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover/item:opacity-100 transition-all duration-200 hover:bg-green-100 dark:hover:bg-green-900/30">
                      <Link href={`/${locale}/settings/categories/edit/${category.id}`}>
                        {tCommon('edit')}
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 bg-gradient-to-br from-red-50 via-red-50/80 to-rose-50/60 dark:from-red-950/30 dark:via-red-900/20 dark:to-rose-900/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-rose-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
            <TrendingDown className="h-24 w-24 text-red-500" />
          </div>
          <CardHeader className="pb-6 relative">
            <CardTitle className="flex items-center gap-4 text-red-700 dark:text-red-400 text-xl">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-200 to-red-100 dark:from-red-800 dark:to-red-900 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <TrendingDown className="h-6 w-6" />
              </div>
              {t('categories.expenseCategories')}
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-400/80 text-base">
              {t('categories.manageCategoriesExpense')}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {expenseCategories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 w-fit mx-auto mb-4">
                    <TrendingDown className="h-12 w-12 text-red-400" />
                  </div>
                  <p className="text-muted-foreground text-base mb-2">
                    {t('categories.noExpenseCategories')}
                  </p>
                  <Button asChild variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                    <Link href={`/${locale}/settings/categories/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('categories.addNew')}
                    </Link>
                  </Button>
                </div>
              ) : (
                expenseCategories.map((category, index) => (
                  <div 
                    key={category.id} 
                    className="group/item flex items-center justify-between p-4 rounded-2xl bg-white/90 dark:bg-gray-800/60 border border-red-100 dark:border-red-800/30 hover:shadow-lg hover:bg-white dark:hover:bg-gray-800 hover:border-red-200 dark:hover:border-red-700 transition-all duration-300 hover:scale-[1.02]"
                    style={{ 
                      animationDelay: `${index * 150}ms`,
                      animation: 'slideInUp 0.6s ease-out forwards'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500 shadow-sm"></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover/item:opacity-100 transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/30">
                      <Link href={`/${locale}/settings/categories/edit/${category.id}`}>
                        {tCommon('edit')}
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table complète avec design amélioré */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-primary/10">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            {t('categories.allCategories')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('categories.totalCategories', { count: categories.length })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <CategoriesList categories={categories} />
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}