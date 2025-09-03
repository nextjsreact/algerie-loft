"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  BarChart3,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Tag,
  CreditCard,
  Coins
} from "lucide-react"

interface Transaction {
  id: string
  amount: number
  date: string
  description: string
  transaction_type: 'income' | 'expense'
  status: 'pending' | 'completed' | 'failed'
  category: string
  loft_id?: string
  currency_id?: string
  payment_method_id?: string
  equivalent_amount_default_currency?: number
}

interface SimpleTransactionsPageProps {
  session: any
  transactions: Transaction[]
  categories: any[]
  lofts: any[]
  currencies: any[]
  paymentMethods: any[]
}

export function SimpleTransactionsPage({
  session,
  transactions: initialTransactions,
  categories,
  lofts,
  currencies,
  paymentMethods
}: SimpleTransactionsPageProps) {
  const t = useTranslations("transactions")
  const tCommon = useTranslations("common")
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [loftFilter, setLoftFilter] = useState<string>("all")
  const [currencyFilter, setCurrencyFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const defaultCurrency = currencies.find(c => c.is_default)
  const defaultCurrencySymbol = defaultCurrency?.symbol || "DA"

  // Filtrage complet
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)
      const startDateMatch = !startDate || transactionDate >= new Date(startDate)
      const endDateMatch = !endDate || transactionDate <= new Date(endDate)
      const matchesSearch = !searchTerm || 
                           transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === "all" || transaction.transaction_type === typeFilter
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter
      const matchesLoft = loftFilter === "all" || transaction.loft_id === loftFilter
      const matchesCurrency = currencyFilter === "all" || transaction.currency_id === currencyFilter
      const matchesPaymentMethod = paymentMethodFilter === "all" || transaction.payment_method_id === paymentMethodFilter

      return startDateMatch && endDateMatch && matchesSearch && matchesType && matchesStatus && 
             matchesCategory && matchesLoft && matchesCurrency && matchesPaymentMethod
    })
  }, [transactions, searchTerm, typeFilter, statusFilter, categoryFilter, loftFilter, 
      currencyFilter, paymentMethodFilter, startDate, endDate])

  // Calculs simples
  const { totalIncome, totalExpenses, netTotal } = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        const amount = parseFloat(transaction.equivalent_amount_default_currency?.toString() ?? transaction.amount.toString())
        if (transaction.transaction_type === "income") {
          acc.totalIncome += amount
        } else {
          acc.totalExpenses += amount
        }
        acc.netTotal = acc.totalIncome - acc.totalExpenses
        return acc
      },
      { totalIncome: 0, totalExpenses: 0, netTotal: 0 }
    )
  }, [filteredTransactions])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header avec design amélioré */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {t('subtitle')}
          </p>
          
          {/* Boutons d'action avec design moderne */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {(session.user.role === "admin" || session.user.role === "manager") && (
              <Button 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border-2 hover:border-blue-300 px-6 py-3 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200" 
                asChild
              >
                <Link href="/transactions/reference-amounts" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{t('referenceAmounts')}</span>
                </Link>
              </Button>
            )}
            {session.user.role === "admin" && (
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl px-6 py-3 text-base font-medium transition-all duration-200" 
                asChild
              >
                <Link href="/transactions/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>{t('addNewTransaction')}</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats avec design amélioré */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700">
                  {t('totalIncome')}
                </CardTitle>
                <div className="p-2 bg-green-500 rounded-full">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {formatAmount(totalIncome)}
                </span>
                <span className="text-green-600 font-medium">{defaultCurrencySymbol}</span>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-red-700">
                  {t('totalExpenses')}
                </CardTitle>
                <div className="p-2 bg-red-500 rounded-full">
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">
                  {formatAmount(totalExpenses)}
                </span>
                <span className="text-red-600 font-medium">{defaultCurrencySymbol}</span>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700">
                  {t('netIncome')}
                </CardTitle>
                <div className="p-2 bg-blue-500 rounded-full">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(Math.abs(netTotal))}
                </span>
                <span className={`font-medium ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {defaultCurrencySymbol}
                </span>
                {netTotal >= 0 ? 
                  <ArrowUpRight className="h-4 w-4 text-green-500" /> : 
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700">
                  {t('transactionCount')}
                </CardTitle>
                <div className="p-2 bg-purple-500 rounded-full">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  {filteredTransactions.length}
                </span>
                <span className="text-purple-600 font-medium">{t('transactions')}</span>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres avec design amélioré */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Filter className="h-5 w-5 text-blue-500" />
                {t('filters')}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchTerm("")
                  setTypeFilter("all")
                  setStatusFilter("all")
                  setCategoryFilter("all")
                  setLoftFilter("all")
                  setCurrencyFilter("all")
                  setPaymentMethodFilter("all")
                  setStartDate("")
                  setEndDate("")
                }}
                className="hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('clearFilters')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Recherche */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  {t('search')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Plage de dates */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {t('dateRange')}
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="jj/mm/aaaa"
                    className="flex-1 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                  <span className="text-gray-500 text-sm font-medium">{t('to')}</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="jj/mm/aaaa"
                    className="flex-1 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>
                {startDate && endDate && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Tag className="h-4 w-4 text-blue-500" />
                  {t('type')}
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
                    <SelectItem value="income">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        {t('income')}
                      </div>
                    </SelectItem>
                    <SelectItem value="expense">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        {t('expense')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Statut */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  {t('status')}
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {t('completed')}
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        {t('pending')}
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        {t('failed')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Catégorie */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Tag className="h-4 w-4 text-blue-500" />
                  {t('category')}
                </label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCategories')}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Loft */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Building className="h-4 w-4 text-blue-500" />
                  {t('loft')}
                </label>
                <Select value={loftFilter} onValueChange={setLoftFilter}>
                  <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allLofts')}</SelectItem>
                    {lofts.map((loft) => (
                      <SelectItem key={loft.id} value={loft.id}>
                        {loft.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Devise */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Coins className="h-4 w-4 text-blue-500" />
                  {t('currency')}
                </label>
                <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                  <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCurrencies')}</SelectItem>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.symbol}</span>
                          <span>{currency.name}</span>
                          {currency.is_default && <Badge variant="outline" className="text-xs">Défaut</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode de paiement */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  {t('paymentMethod')}
                </label>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allPaymentMethods')}</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des transactions avec design amélioré */}
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-blue-500" />
              {t('transactionsList')} ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('noTransactions')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t('noTransactionsDescription')}
                </p>
                {session.user.role === "admin" && (
                  <Button asChild>
                    <Link href="/transactions/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('createFirstTransaction')}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const loft = lofts.find(l => l.id === transaction.loft_id)
                  const paymentMethod = paymentMethods.find(pm => pm.id === transaction.payment_method_id)
                  
                  return (
                    <Card key={transaction.id} className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-full ${transaction.transaction_type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {transaction.transaction_type === 'income' ? 
                                  <TrendingUp className="h-4 w-4 text-green-600" /> : 
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                }
                              </div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                                {transaction.description || t('noDescription')}
                              </h3>
                              <Badge className={`${getStatusColor(transaction.status)} border`}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(transaction.status)}
                                  {t(transaction.status)}
                                </div>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{t('date')}:</span> 
                                <span className="text-gray-600 dark:text-gray-400">{new Date(transaction.date).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{t('category')}:</span> 
                                <span className="text-gray-600 dark:text-gray-400">{transaction.category}</span>
                              </div>
                              {loft && (
                                <div className="flex items-center gap-2">
                                  <Building className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('loft')}:</span> 
                                  <span className="text-gray-600 dark:text-gray-400">{loft.name}</span>
                                </div>
                              )}
                              {paymentMethod && (
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('paymentMethod')}:</span> 
                                  <span className="text-gray-600 dark:text-gray-400">{paymentMethod.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`text-xl font-bold ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.transaction_type === 'income' ? '+' : '-'}
                                {formatAmount(transaction.amount)} {defaultCurrencySymbol}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/transactions/${transaction.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              
                              {session.user.role === "admin" && (
                                <>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/transactions/${transaction.id}/edit`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}