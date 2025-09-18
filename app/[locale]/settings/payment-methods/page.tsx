"use client"

import { getSession } from "@/lib/auth"
import { getPaymentMethods } from "@/app/actions/payment-methods"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, CreditCard, Banknote, Smartphone, Building2, Edit, Trash2, Settings, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react"
import type { PaymentMethod, AuthSession } from "@/lib/types"
import { RoleBasedAccess } from "@/components/auth/role-based-access"

const getPaymentMethodIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'card':
    case 'credit_card':
    case 'debit_card':
      return <CreditCard className="h-5 w-5" />
    case 'cash':
    case 'especes':
      return <Banknote className="h-5 w-5" />
    case 'mobile':
    case 'mobile_payment':
      return <Smartphone className="h-5 w-5" />
    case 'bank':
    case 'bank_transfer':
      return <Building2 className="h-5 w-5" />
    default:
      return <CreditCard className="h-5 w-5" />
  }
}

const getPaymentMethodColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'card':
    case 'credit_card':
    case 'debit_card':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'cash':
    case 'especes':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'mobile':
    case 'mobile_payment':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'bank':
    case 'bank_transfer':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getPaymentMethodTypeTranslation = (type: string, t: any) => {
  switch (type?.toLowerCase()) {
    case 'card':
    case 'credit_card':
    case 'debit_card':
      return t('creditCard')
    case 'cash':
    case 'especes':
      return t('cash')
    case 'bank':
    case 'bank_transfer':
      return t('bankTransfer')
    case 'paypal':
      return t('paypal')
    default:
      return type
  }
}

export default function PaymentMethodsPage() {
  const t = useTranslations('paymentMethods')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const sessionData = await getSession()
        setSession(sessionData)
        
        if (sessionData && ['admin', 'manager'].includes(sessionData.user.role)) {
          const data = await getPaymentMethods()
          setPaymentMethods(data)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Please log in to access payment methods.</p>
        </div>
      </div>
    )
  }

  return (
    <RoleBasedAccess 
      userRole={session.user.role}
      allowedRoles={['admin', 'manager']}
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20 p-8">
          <div className="container mx-auto">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Access Restricted</h3>
                  <p className="text-red-700 mt-2">
                    Payment method management is only available to administrators and managers. 
                    Your current role ({session.user.role}) does not have permission to access this content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* En-tête moderne avec design épuré */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                    <CreditCard className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                      {t('title')}
                    </h1>
                    <p className="text-blue-100 text-xl font-medium mt-2">
                      {t('subtitle')}
                    </p>
                  </div>
                </div>
                
                <p className="text-blue-50 max-w-2xl text-lg leading-relaxed">
                  {t('description')}
                </p>
                
                {/* Métriques en temps réel - Affichage dynamique par type avec alignement fixe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
                  {(() => {
                    // Grouper les méthodes par type
                    const methodsByType = paymentMethods.reduce((acc, method) => {
                      const type = method.type?.toLowerCase() || 'autre';
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    // Définir les couleurs et icônes pour chaque type
                    const typeConfig = {
                      'card': { 
                        icon: <CreditCard className="h-5 w-5" />, 
                        color: 'bg-blue-500/20', 
                        iconColor: 'text-blue-300',
                        label: t('creditCard')
                      },
                      'credit_card': { 
                        icon: <CreditCard className="h-5 w-5" />, 
                        color: 'bg-blue-500/20', 
                        iconColor: 'text-blue-300',
                        label: t('creditCard')
                      },
                      'cash': { 
                        icon: <Banknote className="h-5 w-5" />, 
                        color: 'bg-green-500/20', 
                        iconColor: 'text-green-300',
                        label: t('cash')
                      },
                      'especes': { 
                        icon: <Banknote className="h-5 w-5" />, 
                        color: 'bg-green-500/20', 
                        iconColor: 'text-green-300',
                        label: t('cash')
                      },
                      'bank_transfer': { 
                        icon: <Building2 className="h-5 w-5" />, 
                        color: 'bg-orange-500/20', 
                        iconColor: 'text-orange-300',
                        label: t('bankTransfer')
                      },
                      'bank': { 
                        icon: <Building2 className="h-5 w-5" />, 
                        color: 'bg-orange-500/20', 
                        iconColor: 'text-orange-300',
                        label: t('bankTransfer')
                      },
                      'paypal': { 
                        icon: <Smartphone className="h-5 w-5" />, 
                        color: 'bg-blue-600/20', 
                        iconColor: 'text-blue-300',
                        label: t('paypal')
                      },
                      'mobile': { 
                        icon: <Smartphone className="h-5 w-5" />, 
                        color: 'bg-purple-500/20', 
                        iconColor: 'text-purple-300',
                        label: t('mobilePayment')
                      },
                      'mobile_payment': { 
                        icon: <Smartphone className="h-5 w-5" />, 
                        color: 'bg-purple-500/20', 
                        iconColor: 'text-purple-300',
                        label: t('mobilePayment')
                      },
                      'check': { 
                        icon: <CreditCard className="h-5 w-5" />, 
                        color: 'bg-yellow-500/20', 
                        iconColor: 'text-yellow-300',
                        label: t('check')
                      },
                      'autre': { 
                        icon: <CreditCard className="h-5 w-5" />, 
                        color: 'bg-gray-500/20', 
                        iconColor: 'text-gray-300',
                        label: t('other')
                      }
                    };

                    const typeEntries = Object.entries(methodsByType);
                    
                    return [
                      ...typeEntries.map(([type, count]) => {
                        const config = typeConfig[type] || typeConfig['autre'];
                        return (
                          <div key={type} className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 min-h-[100px] justify-center">
                            <div className={`p-3 rounded-lg ${config.color} mb-3`}>
                              <span className={config.iconColor}>
                                {config.icon}
                              </span>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white leading-tight mb-1">
                                {count}
                              </div>
                              <div className="text-xs text-blue-200 uppercase tracking-wide font-medium">
                                {config.label}
                              </div>
                            </div>
                          </div>
                        );
                      }),
                      // Total avec style distinct
                      <div key="total" className="flex flex-col items-center p-4 bg-white/20 rounded-xl backdrop-blur-sm border border-white/40 min-h-[100px] justify-center">
                        <div className="p-3 rounded-lg bg-indigo-500/30 mb-3">
                          <TrendingUp className="h-5 w-5 text-indigo-200" />
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white leading-tight mb-1">
                            {paymentMethods.length}
                          </div>
                          <div className="text-xs text-blue-100 uppercase tracking-wide font-semibold">
                            {t('total')}
                          </div>
                        </div>
                      </div>
                    ];
                  })()}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 px-8 py-4 text-lg font-semibold rounded-xl"
                >
                  <Link href="/settings/payment-methods/new">
                    <Plus className="mr-3 h-6 w-6" />
                    {t('newMethod')}
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  asChild
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50 backdrop-blur-sm px-6 py-4 rounded-xl transition-all duration-300"
                >
                  <Link href="/settings/payment-methods/settings">
                    <Settings className="mr-2 h-5 w-5" />
                    {t('settings')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Carte principale avec design moderne */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/20 border-b border-slate-200/50 dark:border-gray-700/50 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <CardTitle className="flex items-center gap-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  {t('configuredMethods')}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                  {paymentMethods.length === 0 
                    ? t('noMethodsConfigured')
                    : `${paymentMethods.length} ${t('methodsActive')}`
                  }
                </CardDescription>
              </div>
              
              {/* Statistiques détaillées - Affichage en grille alignée */}
              {paymentMethods.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {(() => {
                    // Grouper les méthodes par type
                    const methodsByType = paymentMethods.reduce((acc, method) => {
                      const type = method.type?.toLowerCase() || 'autre';
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    // Définir les couleurs pour chaque type
                    const typeColors = {
                      'card': 'text-blue-600 dark:text-blue-400',
                      'credit_card': 'text-blue-600 dark:text-blue-400',
                      'cash': 'text-green-600 dark:text-green-400',
                      'especes': 'text-green-600 dark:text-green-400',
                      'bank_transfer': 'text-orange-600 dark:text-orange-400',
                      'bank': 'text-orange-600 dark:text-orange-400',
                      'paypal': 'text-blue-700 dark:text-blue-300',
                      'mobile': 'text-purple-600 dark:text-purple-400',
                      'mobile_payment': 'text-purple-600 dark:text-purple-400',
                      'check': 'text-yellow-600 dark:text-yellow-400',
                      'autre': 'text-gray-600 dark:text-gray-400'
                    };

                    const typeLabels = {
                      'card': t('creditCard'),
                      'credit_card': t('creditCard'),
                      'cash': t('cash'),
                      'especes': t('cash'),
                      'bank_transfer': t('bankTransfer'),
                      'bank': t('bankTransfer'),
                      'paypal': t('paypal'),
                      'mobile': t('mobilePayment'),
                      'mobile_payment': t('mobilePayment'),
                      'check': t('check'),
                      'autre': t('other')
                    };

                    const typeEntries = Object.entries(methodsByType);
                    
                    return [
                      ...typeEntries.map(([type, count]) => {
                        const color = typeColors[type] || typeColors['autre'];
                        const label = typeLabels[type] || t('other');
                        
                        return (
                          <div key={type} className="text-center p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-gray-700/50 min-h-[100px] flex flex-col justify-center">
                            <div className={`text-3xl font-bold leading-tight mb-2 ${color}`}>
                              {count}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                              {label}
                            </div>
                          </div>
                        );
                      }),
                      // Total avec style distinct
                      <div key="total" className="text-center p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800 min-h-[100px] flex flex-col justify-center">
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 leading-tight mb-2">
                          {paymentMethods.length}
                        </div>
                        <div className="text-sm text-indigo-600 dark:text-indigo-400 uppercase tracking-wide font-semibold">
                          {t('total')}
                        </div>
                      </div>
                    ];
                  })()}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {paymentMethods.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <CreditCard className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {t('noMethodConfigured')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2 max-w-md mx-auto">
                  {t('startByAdding')}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mb-8 max-w-lg mx-auto">
                  {t('securePayments')}
                </p>
                
                <Button asChild size="lg" className="px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/settings/payment-methods/new">
                    <Plus className="mr-3 h-5 w-5" />
                    {t('createFirstMethod')}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
                {paymentMethods.map((method, index) => (
                  <Card 
                    key={method.id} 
                    className="group relative overflow-hidden border-0 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800/80 dark:to-indigo-950/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] rounded-2xl flex flex-col"
                    style={{ 
                      animationDelay: `${index * 150}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse"></div>
                    
                    <CardContent className="p-6 relative flex flex-col flex-1">
                      {/* En-tête de la carte */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 border border-indigo-200/50 dark:border-indigo-800/50">
                              {getPaymentMethodIcon(method.type || '')}
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 truncate mb-2">
                              {method.name}
                            </h3>
                            {method.type && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs font-medium px-3 py-1 rounded-full ${getPaymentMethodColor(method.type)} border-0 shadow-sm`}
                              >
                                {getPaymentMethodTypeTranslation(method.type, t)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Zone de contenu flexible */}
                      <div className="flex-1 mb-6">
                        {method.details ? (
                          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-gray-800/50 border border-slate-200/50 dark:border-gray-700/50">
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {t('additionalInfoAvailable')}
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50/30 dark:bg-gray-800/30 border border-slate-200/30 dark:border-gray-700/30">
                            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                              {t('noAdditionalDetails')}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Pied de carte avec boutons alignés - toujours en bas */}
                      <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-gray-700/50 mt-auto">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="font-medium">{t('active')}</span>
                        </div>
                        
                        {/* Boutons d'action parfaitement alignés */}
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/settings/payment-methods/edit/${method.id}`}
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 min-w-[100px] bg-white/80 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-300 dark:border-gray-600 dark:bg-gray-800/80 dark:hover:bg-indigo-950/50 transition-all duration-200 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                          >
                            <Edit className="h-4 w-4" />
                            {t('modify')}
                          </Link>
                          
                          <button 
                            className="inline-flex items-center justify-center h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border border-slate-300 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-800 transition-all duration-200 rounded-lg bg-white/80 dark:bg-gray-800/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </RoleBasedAccess>
  )
}