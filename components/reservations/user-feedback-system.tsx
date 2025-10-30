"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Loader2, 
  X, 
  Wifi, 
  WifiOff,
  Clock,
  Zap,
  Shield,
  Heart
} from 'lucide-react'

type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading'
type FeedbackPosition = 'top' | 'bottom' | 'center'

interface FeedbackMessage {
  id: string
  type: FeedbackType
  title: string
  message: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  progress?: number
}

interface UserFeedbackSystemProps {
  position?: FeedbackPosition
  maxMessages?: number
  defaultDuration?: number
}

interface FeedbackContextType {
  showFeedback: (message: Omit<FeedbackMessage, 'id'>) => string
  hideFeedback: (id: string) => void
  clearAll: () => void
  showSuccess: (title: string, message: string, duration?: number) => string
  showError: (title: string, message: string, persistent?: boolean) => string
  showWarning: (title: string, message: string, duration?: number) => string
  showInfo: (title: string, message: string, duration?: number) => string
  showLoading: (title: string, message: string, progress?: number) => string
  updateProgress: (id: string, progress: number) => void
}

// Global feedback state
let globalFeedbackState: {
  messages: FeedbackMessage[]
  listeners: Set<(messages: FeedbackMessage[]) => void>
} = {
  messages: [],
  listeners: new Set()
}

// Global feedback functions
export const feedbackSystem: FeedbackContextType = {
  showFeedback: (message) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2)
    const newMessage: FeedbackMessage = { ...message, id }
    
    globalFeedbackState.messages.push(newMessage)
    globalFeedbackState.listeners.forEach(listener => listener([...globalFeedbackState.messages]))
    
    // Auto-hide non-persistent messages
    if (!message.persistent && message.type !== 'loading') {
      const duration = message.duration || 5000
      setTimeout(() => {
        feedbackSystem.hideFeedback(id)
      }, duration)
    }
    
    return id
  },
  
  hideFeedback: (id) => {
    globalFeedbackState.messages = globalFeedbackState.messages.filter(m => m.id !== id)
    globalFeedbackState.listeners.forEach(listener => listener([...globalFeedbackState.messages]))
  },
  
  clearAll: () => {
    globalFeedbackState.messages = []
    globalFeedbackState.listeners.forEach(listener => listener([]))
  },
  
  showSuccess: (title, message, duration = 4000) => {
    return feedbackSystem.showFeedback({ type: 'success', title, message, duration })
  },
  
  showError: (title, message, persistent = true) => {
    return feedbackSystem.showFeedback({ type: 'error', title, message, persistent })
  },
  
  showWarning: (title, message, duration = 6000) => {
    return feedbackSystem.showFeedback({ type: 'warning', title, message, duration })
  },
  
  showInfo: (title, message, duration = 5000) => {
    return feedbackSystem.showFeedback({ type: 'info', title, message, duration })
  },
  
  showLoading: (title, message, progress) => {
    return feedbackSystem.showFeedback({ type: 'loading', title, message, progress, persistent: true })
  },
  
  updateProgress: (id, progress) => {
    const message = globalFeedbackState.messages.find(m => m.id === id)
    if (message) {
      message.progress = progress
      globalFeedbackState.listeners.forEach(listener => listener([...globalFeedbackState.messages]))
    }
  }
}

export function UserFeedbackSystem({ 
  position = 'top',
  maxMessages = 5,
  defaultDuration = 5000 
}: UserFeedbackSystemProps) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([])
  const [isOnline, setIsOnline] = useState(true)

  // Subscribe to global feedback state
  useEffect(() => {
    const listener = (newMessages: FeedbackMessage[]) => {
      setMessages(newMessages.slice(-maxMessages))
    }
    
    globalFeedbackState.listeners.add(listener)
    setMessages(globalFeedbackState.messages.slice(-maxMessages))
    
    return () => {
      globalFeedbackState.listeners.delete(listener)
    }
  }, [maxMessages])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      feedbackSystem.showSuccess('Connection Restored', 'You are back online!')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      feedbackSystem.showWarning('Connection Lost', 'You are currently offline. Some features may not work.')
    }
    
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getIcon = (type: FeedbackType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getVariant = (type: FeedbackType) => {
    switch (type) {
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'info':
        return 'default'
      case 'loading':
        return 'default'
      default:
        return 'default'
    }
  }

  const getBackgroundColor = (type: FeedbackType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'loading':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const positionClasses = {
    top: 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    bottom: 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
    center: 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'
  }

  if (messages.length === 0) {
    return null
  }

  return (
    <div className={`${positionClasses[position]} w-full max-w-md px-4`}>
      <div className="space-y-2">
        {messages.map((message, index) => (
          <Card 
            key={message.id}
            className={`
              ${getBackgroundColor(message.type)} 
              shadow-lg border backdrop-blur-sm
              animate-in slide-in-from-top-2 duration-300
              ${index === 0 ? 'animate-in' : ''}
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(message.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {message.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {message.message}
                      </p>
                    </div>
                    
                    {!message.persistent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => feedbackSystem.hideFeedback(message.id)}
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Progress bar for loading messages */}
                  {message.type === 'loading' && typeof message.progress === 'number' && (
                    <div className="mt-3">
                      <Progress value={message.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(message.progress)}% complete
                      </p>
                    </div>
                  )}
                  
                  {/* Action button */}
                  {message.action && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={message.action.onClick}
                        className="text-xs"
                      >
                        {message.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Connection status indicator */}
        <div className="flex justify-center">
          <Badge 
            variant={isOnline ? "default" : "destructive"} 
            className="text-xs px-2 py-1"
          >
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Specialized feedback hooks for common reservation scenarios
export function useReservationFeedback() {
  const showAuthSuccess = useCallback((userName: string) => {
    return feedbackSystem.showSuccess(
      'Welcome back!',
      `Successfully signed in as ${userName}. You can now proceed with your reservation.`
    )
  }, [])

  const showAuthError = useCallback((error: string) => {
    return feedbackSystem.showError(
      'Authentication Failed',
      error || 'Please check your credentials and try again.',
      true
    )
  }, [])

  const showSearchProgress = useCallback(() => {
    return feedbackSystem.showLoading(
      'Searching Lofts',
      'Finding available lofts that match your criteria...'
    )
  }, [])

  const showSearchResults = useCallback((count: number) => {
    return feedbackSystem.showSuccess(
      'Search Complete',
      `Found ${count} available loft${count !== 1 ? 's' : ''} for your dates.`
    )
  }, [])

  const showBookingProgress = useCallback((step: string) => {
    return feedbackSystem.showLoading(
      'Processing Booking',
      `${step}... Please don't close this window.`
    )
  }, [])

  const showBookingSuccess = useCallback((reservationId: string) => {
    return feedbackSystem.showSuccess(
      'Reservation Confirmed!',
      `Your booking has been confirmed. Reservation ID: ${reservationId}`,
      8000
    )
  }, [])

  const showBookingError = useCallback((error: string) => {
    return feedbackSystem.showError(
      'Booking Failed',
      error || 'There was an issue processing your reservation. Please try again.',
      true
    )
  }, [])

  const showValidationError = useCallback((field: string, message: string) => {
    return feedbackSystem.showWarning(
      'Validation Error',
      `${field}: ${message}`,
      6000
    )
  }, [])

  const showNetworkError = useCallback(() => {
    return feedbackSystem.showError(
      'Connection Problem',
      'Unable to connect to our servers. Please check your internet connection.',
      true
    )
  }, [])

  const showMaintenanceMode = useCallback(() => {
    return feedbackSystem.showWarning(
      'Maintenance Mode',
      'Our system is currently under maintenance. Some features may be temporarily unavailable.',
      10000
    )
  }, [])

  const updateBookingProgress = useCallback((id: string, progress: number, step: string) => {
    feedbackSystem.updateProgress(id, progress)
    const message = globalFeedbackState.messages.find(m => m.id === id)
    if (message) {
      message.message = `${step}... Please don't close this window.`
    }
  }, [])

  return {
    showAuthSuccess,
    showAuthError,
    showSearchProgress,
    showSearchResults,
    showBookingProgress,
    showBookingSuccess,
    showBookingError,
    showValidationError,
    showNetworkError,
    showMaintenanceMode,
    updateBookingProgress,
    feedbackSystem
  }
}

// Performance monitoring feedback
export function usePerformanceFeedback() {
  const showSlowConnection = useCallback(() => {
    return feedbackSystem.showWarning(
      'Slow Connection Detected',
      'Your connection seems slow. The reservation process may take longer than usual.',
      8000
    )
  }, [])

  const showOptimizedExperience = useCallback(() => {
    return feedbackSystem.showInfo(
      'Optimized for Mobile',
      'We\'ve optimized the experience for your mobile device.',
      4000
    )
  }, [])

  const showDataSaver = useCallback(() => {
    return feedbackSystem.showInfo(
      'Data Saver Mode',
      'Reduced data usage mode is active. Some images may load at lower quality.',
      6000
    )
  }, [])

  return {
    showSlowConnection,
    showOptimizedExperience,
    showDataSaver
  }
}

// Accessibility feedback
export function useAccessibilityFeedback() {
  const announcePageChange = useCallback((pageName: string) => {
    // For screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = `Navigated to ${pageName}`
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  const announceFormError = useCallback((fieldName: string, error: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = `Error in ${fieldName}: ${error}`
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 3000)
  }, [])

  return {
    announcePageChange,
    announceFormError
  }
}