import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  AlertTriangle, 
  Info, 
  XCircle, 
  CheckCircle, 
  RefreshCw,
  HelpCircle,
  Zap
} from "lucide-react"

export interface CurrencyError {
  type: 'CURRENCY_NOT_FOUND' | 'INVALID_RATE' | 'CALCULATION_ERROR' | 'DEFAULT_CURRENCY_MISSING'
  message: string
  fallbackAction: 'USE_DEFAULT_RATE' | 'SHOW_WARNING' | 'BLOCK_TRANSACTION'
}

interface CurrencyErrorDisplayProps {
  error: CurrencyError
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function CurrencyErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  className = "" 
}: CurrencyErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'CURRENCY_NOT_FOUND':
        return <XCircle className="h-4 w-4" />
      case 'INVALID_RATE':
        return <AlertTriangle className="h-4 w-4" />
      case 'CALCULATION_ERROR':
        return <XCircle className="h-4 w-4" />
      case 'DEFAULT_CURRENCY_MISSING':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getErrorVariant = () => {
    switch (error.fallbackAction) {
      case 'BLOCK_TRANSACTION':
        return 'destructive'
      case 'SHOW_WARNING':
        return 'default'
      case 'USE_DEFAULT_RATE':
        return 'default'
      default:
        return 'default'
    }
  }

  const getErrorTitle = () => {
    switch (error.type) {
      case 'CURRENCY_NOT_FOUND':
        return 'Currency Not Found'
      case 'INVALID_RATE':
        return 'Invalid Exchange Rate'
      case 'CALCULATION_ERROR':
        return 'Conversion Error'
      case 'DEFAULT_CURRENCY_MISSING':
        return 'Default Currency Missing'
      default:
        return 'Conversion Error'
    }
  }

  const getFallbackMessage = () => {
    switch (error.fallbackAction) {
      case 'USE_DEFAULT_RATE':
        return 'Using 1:1 conversion rate as fallback'
      case 'SHOW_WARNING':
        return 'Please verify the conversion manually'
      case 'BLOCK_TRANSACTION':
        return 'Transaction cannot proceed'
      default:
        return ''
    }
  }

  return (
    <Alert variant={getErrorVariant()} className={className}>
      <div className="flex items-start gap-2">
        {getErrorIcon()}
        <div className="flex-1">
          <AlertTitle className="text-sm font-medium">
            {getErrorTitle()}
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            {error.message}
            {getFallbackMessage() && (
              <div className="mt-2 text-xs opacity-80">
                {getFallbackMessage()}
              </div>
            )}
          </AlertDescription>
          
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button variant="ghost" size="sm" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}

interface ConversionWarningProps {
  message: string
  exchangeRate?: number
  fromCurrency?: string
  toCurrency?: string
  isApproximate?: boolean
  className?: string
}

export function ConversionWarning({ 
  message, 
  exchangeRate, 
  fromCurrency, 
  toCurrency, 
  isApproximate = false,
  className = "" 
}: ConversionWarningProps) {
  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">
        {isApproximate ? 'Approximate Conversion' : 'Conversion Notice'}
      </AlertTitle>
      <AlertDescription className="text-yellow-700">
        {message}
        {exchangeRate && fromCurrency && toCurrency && (
          <div className="mt-2 text-xs">
            Rate used: 1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface ConversionSuccessProps {
  originalAmount: number
  convertedAmount: number
  exchangeRate: number
  fromCurrency: string
  toCurrency: string
  className?: string
}

export function ConversionSuccess({ 
  originalAmount, 
  convertedAmount, 
  exchangeRate, 
  fromCurrency, 
  toCurrency,
  className = "" 
}: ConversionSuccessProps) {
  return (
    <Alert className={`border-green-200 bg-green-50 ${className}`}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">
        Conversion Successful
      </AlertTitle>
      <AlertDescription className="text-green-700">
        <div className="space-y-1">
          <div>{originalAmount} {fromCurrency} → {convertedAmount.toFixed(2)} {toCurrency}</div>
          <div className="text-xs opacity-80">
            Exchange rate: 1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface CurrencyStatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning'
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CurrencyStatusIndicator({ 
  status, 
  message, 
  size = 'md' 
}: CurrencyStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <RefreshCw className={`${sizeClasses[size]} animate-spin`} />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100'
        }
      case 'success':
        return {
          icon: <CheckCircle className={sizeClasses[size]} />,
          color: 'text-green-500',
          bgColor: 'bg-green-100'
        }
      case 'error':
        return {
          icon: <XCircle className={sizeClasses[size]} />,
          color: 'text-red-500',
          bgColor: 'bg-red-100'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className={sizeClasses[size]} />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100'
        }
      default:
        return {
          icon: <Info className={sizeClasses[size]} />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100'
        }
    }
  }

  const { icon, color, bgColor } = getStatusDisplay()

  if (message) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bgColor}`}>
              <span className={color}>{icon}</span>
              {size !== 'sm' && (
                <span className={`text-xs font-medium ${color}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <span className={color}>
      {icon}
    </span>
  )
}

interface ConversionTooltipProps {
  exchangeRate: number
  fromCurrency: string
  toCurrency: string
  conversionDate?: Date
  isApproximate?: boolean
  children: React.ReactNode
}

export function ConversionTooltip({ 
  exchangeRate, 
  fromCurrency, 
  toCurrency, 
  conversionDate,
  isApproximate = false,
  children 
}: ConversionTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-medium">
              1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
            </div>
            {conversionDate && (
              <div className="text-xs opacity-80">
                {conversionDate.toLocaleDateString()}
              </div>
            )}
            {isApproximate && (
              <div className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Approximate rate
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface CurrencyHelpButtonProps {
  title?: string
  content: string
  size?: 'sm' | 'md' | 'lg'
}

export function CurrencyHelpButton({ 
  title = "Currency Conversion Help", 
  content, 
  size = 'sm' 
}: CurrencyHelpButtonProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            <HelpCircle className={`${sizeClasses[size]} text-gray-400 hover:text-gray-600`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div>
            <div className="font-medium mb-1">{title}</div>
            <div className="text-sm">{content}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}