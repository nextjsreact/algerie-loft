"use client"

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Wifi, 
  WifiOff,
  Clock,
  Shield
} from 'lucide-react'

interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
}

interface ReservationErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
  isOnline: boolean
}

interface ReservationErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
}

export class ReservationErrorBoundary extends Component<
  ReservationErrorBoundaryProps,
  ReservationErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ReservationErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
      retryCount: 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ReservationErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to monitoring service
    this.logError(error, errorInfo)
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private handleOnline = () => {
    this.setState({ isOnline: true })
  }

  private handleOffline = () => {
    this.setState({ isOnline: false })
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Reservation Error Boundary:', errorData)
    }

    // Send to error tracking service (e.g., Sentry, LogRocket)
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('Failed to log error:', err)
      })
    } catch (err) {
      console.error('Failed to send error log:', err)
    }
  }

  private getUserId(): string | null {
    try {
      const token = localStorage.getItem('client_auth_token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.sub || null
      }
    } catch (err) {
      // Ignore parsing errors
    }
    return null
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2)
      sessionStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount >= maxRetries) {
      return
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      errorId: this.generateErrorId()
    }))
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private getErrorType(error: Error): 'network' | 'auth' | 'validation' | 'server' | 'client' | 'unknown' {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network'
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'auth'
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation'
    }
    if (message.includes('server') || message.includes('500')) {
      return 'server'
    }
    if (message.includes('chunk') || message.includes('loading')) {
      return 'client'
    }
    
    return 'unknown'
  }

  private getErrorMessage(errorType: string): { title: string; description: string; suggestion: string } {
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Problem',
          description: 'Unable to connect to our servers. Please check your internet connection.',
          suggestion: 'Try refreshing the page or check your network connection.'
        }
      case 'auth':
        return {
          title: 'Authentication Error',
          description: 'Your session has expired or there was an authentication problem.',
          suggestion: 'Please sign in again to continue with your reservation.'
        }
      case 'validation':
        return {
          title: 'Invalid Data',
          description: 'Some of the information provided is not valid.',
          suggestion: 'Please check your input and try again.'
        }
      case 'server':
        return {
          title: 'Server Error',
          description: 'Our servers are experiencing issues. This is not your fault.',
          suggestion: 'Please try again in a few minutes or contact support if the problem persists.'
        }
      case 'client':
        return {
          title: 'Loading Error',
          description: 'There was a problem loading part of the application.',
          suggestion: 'Refreshing the page should resolve this issue.'
        }
      default:
        return {
          title: 'Unexpected Error',
          description: 'Something unexpected happened while processing your reservation.',
          suggestion: 'Please try again or contact support if the problem continues.'
        }
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorType = this.getErrorType(this.state.error)
      const errorMessage = this.getErrorMessage(errorType)
      const maxRetries = this.props.maxRetries || 3
      const canRetry = this.state.retryCount < maxRetries

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-white/90 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-600">{errorMessage.title}</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Connection Status */}
              <Alert className={`${this.state.isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {this.state.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${this.state.isOnline ? 'text-green-800' : 'text-red-800'}`}>
                    {this.state.isOnline ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </Alert>

              {/* Error Description */}
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  {errorMessage.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage.suggestion}
                </p>
              </div>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-sm flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Technical Details (Development)
                  </summary>
                  <div className="mt-3 space-y-2 text-xs font-mono">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Retry Count:</strong> {this.state.retryCount}/{maxRetries}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex-1 min-h-[44px]"
                    disabled={!this.state.isOnline}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({maxRetries - this.state.retryCount} left)
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex-1 min-h-[44px]"
                  disabled={!this.state.isOnline}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex-1 min-h-[44px]"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Support Information */}
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Need Help?</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  If this problem continues, please contact our support team with error ID: 
                  <span className="font-mono font-medium"> {this.state.errorId}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
                  <a 
                    href="mailto:support@loftalgerie.com" 
                    className="text-blue-600 hover:text-blue-800 underline"
                    dir="ltr"
                  >
                    support@loftalgerie.com
                  </a>
                  <span className="hidden sm:inline text-blue-400">•</span>
                  <a 
                    href="tel:+213560362543" 
                    className="text-blue-600 hover:text-blue-800 underline"
                    dir="ltr"
                  >
                    +213 56 03 62 543
                  </a>
                </div>
              </div>

              {/* Retry Limit Reached */}
              {!canRetry && (
                <Alert variant="destructive">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Maximum retry attempts reached. Please reload the page or contact support for assistance.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: { componentStack?: string }) => {
    // Log error
    console.error('Reservation Error:', error)
    
    // You can integrate with error tracking services here
    if (typeof window !== 'undefined') {
      // Send to error tracking service
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo?.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        console.error('Failed to log error:', err)
      })
    }
  }

  return { handleError }
}