"use client"

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  Clock
} from "lucide-react"

interface LoadingStateProps {
  message?: string
  progress?: number
  className?: string
}

export function CurrencyLoadingState({ 
  message = "Converting currency...", 
  progress,
  className = "" 
}: LoadingStateProps) {
  return (
    <div className={`flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 ${className}`}>
      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      <div className="flex-1">
        <div className="text-sm font-medium text-blue-800">{message}</div>
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-2" />
        )}
      </div>
    </div>
  )
}

interface ConversionFeedbackProps {
  originalAmount: number
  convertedAmount: number
  fromCurrency: string
  toCurrency: string
  exchangeRate: number
  isApproximate?: boolean
  conversionDate?: Date
  onRefresh?: () => void
  className?: string
}

export function ConversionFeedback({ 
  originalAmount, 
  convertedAmount, 
  fromCurrency, 
  toCurrency, 
  exchangeRate,
  isApproximate = false,
  conversionDate,
  onRefresh,
  className = "" 
}: ConversionFeedbackProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-800 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Conversion Applied
            {isApproximate && (
              <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                Approximate
              </Badge>
            )}
          </CardTitle>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Original Amount:</span>
            <span className="font-medium text-green-800">
              {originalAmount.toFixed(2)} {fromCurrency}
            </span>
          </div>
          
          <div className="flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-green-600" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Converted Amount:</span>
            <span className="font-bold text-green-800">
              {convertedAmount.toFixed(2)} {toCurrency}
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-xs text-green-700 hover:text-green-800"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>

          {showDetails && (
            <div className="pt-2 border-t border-green-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">Exchange Rate:</span>
                <span className="font-mono text-green-700">
                  1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                </span>
              </div>
              
              {conversionDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600">Conversion Date:</span>
                  <span className="text-green-700">
                    {conversionDate.toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {isApproximate && (
                <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  This conversion uses an approximate exchange rate
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface CurrencyWarningBannerProps {
  title: string
  message: string
  type?: 'warning' | 'info' | 'error'
  dismissible?: boolean
  onDismiss?: () => void
  actions?: React.ReactNode
  className?: string
}

export function CurrencyWarningBanner({ 
  title, 
  message, 
  type = 'warning',
  dismissible = false,
  onDismiss,
  actions,
  className = "" 
}: CurrencyWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          icon: <XCircle className="h-5 w-5" />
        }
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          icon: <Info className="h-5 w-5" />
        }
      case 'warning':
      default:
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700',
          icon: <AlertTriangle className="h-5 w-5" />
        }
    }
  }

  const styles = getTypeStyles()

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <Alert className={`${styles.bgColor} ${styles.borderColor} ${className}`}>
      <div className="flex items-start gap-3">
        <span className={styles.iconColor}>
          {styles.icon}
        </span>
        <div className="flex-1">
          <AlertTitle className={`${styles.titleColor} text-sm font-medium`}>
            {title}
          </AlertTitle>
          <AlertDescription className={`${styles.messageColor} text-sm mt-1`}>
            {message}
          </AlertDescription>
          
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>
        
        {dismissible && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="p-1 h-auto"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

interface ConversionProgressProps {
  steps: {
    label: string
    status: 'pending' | 'loading' | 'completed' | 'error'
    message?: string
  }[]
  className?: string
}

export function ConversionProgress({ steps, className = "" }: ConversionProgressProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Currency Conversion Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              {getStepIcon(step.status)}
              <div className="flex-1">
                <div className="text-sm font-medium">{step.label}</div>
                {step.message && (
                  <div className="text-xs text-gray-600 mt-1">{step.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface CurrencySkeletonProps {
  lines?: number
  className?: string
}

export function CurrencySkeleton({ lines = 3, className = "" }: CurrencySkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

interface RealTimeConversionProps {
  amount: number
  fromCurrency: string
  toCurrency: string
  onConversionUpdate?: (result: { convertedAmount: number; exchangeRate: number }) => void
  refreshInterval?: number
  className?: string
}

export function RealTimeConversion({ 
  amount, 
  fromCurrency, 
  toCurrency, 
  onConversionUpdate,
  refreshInterval = 30000, // 30 seconds
  className = "" 
}: RealTimeConversionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        // Trigger refresh logic here
        setLastUpdate(new Date())
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  return (
    <div className={`p-3 bg-gray-50 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">Live Conversion</span>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="text-sm">
        <span className="font-medium">{amount} {fromCurrency}</span>
        <span className="mx-2 text-gray-400">→</span>
        <span className="font-bold text-green-600">
          {/* Converted amount would be displayed here */}
          {toCurrency}
        </span>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  )
}