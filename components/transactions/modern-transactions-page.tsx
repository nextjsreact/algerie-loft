"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { useTranslations } from "next-intl"
import { DateRange } from "react-day-picker"
import Link from "next/link"
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Wallet,
  CreditCard,
  Building,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteTransaction } from "@/app/actions/transactions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

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
  ratio_at_transaction?: number
}

interface ModernTransactionsPageProps {
  session: any
  transactions: Transaction[]
  categories: any[]
  lofts: any[]
  currencies: any[]
  paymentMethods: any[]
}

export function ModernTransactionsPage({
  session,
  transactions: initialTransactions,
  categories,
  lofts,
  currencies,
  paymentMethods
}: ModernTransactionsPageProps) {
  const t = useTranslations("transactions")
  const tCommon = useTranslations("common")
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [loftFilter, setLoftFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

  const defaultCurrency = currencies.find(c => c.is_default)
  const defaultCurrencySymbol = defaultCurrency?.symbol || "DA"

  // Filtrage des transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)
      const matchesDateRange = (!dateRange?.from || transactionDate >= dateRange.from) &&
                              (!dateRange?.to || transactionDate <= dateRange.to)
      const matchesSearch = !searchTerm || 
                           transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === "all" || transaction.transaction_type === typeFilter
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter
      const matchesLoft = loftFilter === "all" || transaction.loft_id === loftFilter

      return matchesDateRange && matchesSearch && matchesType && matchesStatus && matchesCategory && matchesLoft
    })
  }, [transactions, dateRange, searchTerm, typeFilter, statusFilter, categoryFilter, loftFilter])

  // Calculs des totaux
  const { totalIncome, totalExpenses, netTotal, pendingCount, completedCount } = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        const amount = parseFloat(transaction.equivalent_amount_default_currency?.toString() ?? transaction.amount.toString())
        if (transaction.transaction_type === "income") {
          acc.totalIncome += amount
        } else {
          acc.totalExpenses += amount
        }
        
        if (transaction.status === 'pending') acc.pendingCount++
        if (transaction.status === 'completed') acc.completedCount++
        
        acc.netTotal = acc.totalIncome - acc.totalExpenses
        return acc
      },
      { totalIncome: 0, totalExpenses: 0, netTotal: 0, pendingCount: 0, completedCount: 0 }
    )
  }, [filteredTransactions])

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true)
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error("Failed to delete transaction:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const clearFilters = () => {
    setDateRange(undefined)
    setSearchTerm("")
    setTypeFilter("all")
    setStatusFilter("all")
    setCategoryFilter("all")
    setLoftFilter("all")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('title', { ns: 'transactions' })}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {t('subtitle', { ns: 'transactions' })}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {(session.user.role === "admin" || session.user.role === "manager") && (
              <Button 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border-2 hover:border-blue-300 px-6 py-3 text-base font-medium min-w-fit" 
                asChild
              >
                <Link href="/transactions/reference-amounts" className="flex items-center justify-center gap-2">
                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap font-medium">{t('referenceAmounts', { ns: 'transactions' })}</span>
                </Link>
              </Button>
            )}
            {session.user.role === "admin" && (
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg px-6 py-3 text-base font-medium min-w-fit" 
                asChild
              >
                <Link href="/transactions/new" className="flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap font-medium text-white">{t('addNewTransaction', { ns: 'transactions' })}</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700">
                  {t('totalIncome', { ns: 'transactions' })}
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
                  {t('totalExpenses', { ns: 'transactions' })}
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
                  {t('netIncome', { ns: 'transactions' })}
                </CardTitle>
                <div className="p-2 bg-blue-500 rounded-full">
                  <Wallet className="h-4 w-4 text-white" />
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
                  {t('transactionCount', { ns: 'transactions' })}
                </CardTitle>
                <div className="p-2 bg-purple-500 rounded-full">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-600">{t('completed', { ns: 'transactions' })}</span>
                  <span className="font-bold text-purple-600">{completedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-600">{t('pending', { ns: 'transactions' })}</span>
                  <span className="font-bold text-yellow-600">{pendingCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('filters', { ns: 'transactions' })}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('clearFilters', { ns: 'transactions' })}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {t('search', { ns: 'transactions' })}
                </Label>
                <Input
                  placeholder={t('searchPlaceholder', { ns: 'transactions' })}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-2 hover:border-blue-300 focus:border-blue-500"
                />
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('dateRange', { ns: 'transactions' })}
                </Label>
                <DatePickerWithRange value={dateRange} onChange={setDateRange} />
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t('type', { ns: 'transactions' })}
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-white border-2 hover:border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes', { ns: 'transactions' })}</SelectItem>
                    <SelectItem value="income">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        {t('income', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                    <SelectItem value="expense">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        {t('expense', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {t('status', { ns: 'transactions' })}
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-2 hover:border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses', { ns: 'transactions' })}</SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {t('completed', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        {t('pending', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        {t('failed', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t('category', { ns: 'transactions' })}
                </Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-white border-2 hover:border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCategories', { ns: 'transactions' })}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Loft Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {t('loft', { ns: 'transactions' })}
                </Label>
                <Select value={loftFilter} onValueChange={setLoftFilter}>
                  <SelectTrigger className="bg-white border-2 hover:border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allLofts', { ns: 'transactions' })}</SelectItem>
                    {lofts.map((loft) => (
                      <SelectItem key={loft.id} value={loft.id}>
                        {loft.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              {t('transactionsList', { ns: 'transactions' })} ({filteredTransactions.length})
            </h2>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('noTransactions', { ns: 'transactions' })}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('noTransactionsDescription', { ns: 'transactions' })}
                </p>
                {session.user.role === "admin" && (
                  <Button asChild>
                    <Link href="/transactions/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('createFirstTransaction', { ns: 'transactions' })}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTransactions.map((transaction) => {
                const currency = currencies.find(c => c.id === transaction.currency_id)
                const loft = lofts.find(l => l.id === transaction.loft_id)
                const paymentMethod = paymentMethods.find(pm => pm.id === transaction.payment_method_id)
                
                return (
                  <Card key={transaction.id} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-full ${transaction.transaction_type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                              {transaction.transaction_type === 'income' ? 
                                <TrendingUp className="h-4 w-4 text-green-600" /> : 
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              }
                            </div>
                            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                              {transaction.description || t('noDescription', { ns: 'transactions' })}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(transaction.date), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(transaction.status)} border`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(transaction.status)}
                            {t(`transactions.${transaction.status}`)}
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Amount */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">
                          {t('amount', { ns: 'transactions' })}
                        </span>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.transaction_type === 'income' ? '+' : '-'}
                            {formatAmount(transaction.amount)} {currency?.symbol || defaultCurrencySymbol}
                          </div>
                          {transaction.equivalent_amount_default_currency && 
                           transaction.currency_id !== defaultCurrency?.id && (
                            <div className="text-xs text-gray-500">
                              ≈ {formatAmount(transaction.equivalent_amount_default_currency)} {defaultCurrencySymbol}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
                        {transaction.category && (
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{t('category', { ns: 'transactions' })}:</span>
                            <span className="font-medium">{transaction.category}</span>
                          </div>
                        )}
                        
                        {loft && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{t('loft', { ns: 'transactions' })}:</span>
                            <span className="font-medium">{loft.name}</span>
                          </div>
                        )}
                        
                        {paymentMethod && (
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{t('paymentMethod', { ns: 'transactions' })}:</span>
                            <span className="font-medium">{paymentMethod.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/transactions/${transaction.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            {tCommon('view')}
                          </Link>
                        </Button>
                        
                        {session.user.role === "admin" && (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/transactions/${transaction.id}/edit`}>
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('deleteConfirmTitle', { ns: 'transactions' })}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('deleteConfirmDescription', { ns: 'transactions' })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(transaction.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={isLoading}
                                  >
                                    {isLoading ? (
                                      <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        {tCommon('deleting')}
                                      </div>
                                    ) : (
                                      tCommon('delete')
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}