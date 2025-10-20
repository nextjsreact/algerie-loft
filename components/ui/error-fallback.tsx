"use client"

import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  title?: string
  description?: string
  showDetails?: boolean
}

export function ErrorFallback({
  error,
  resetError,
  title = "Something went wrong",
  description = "We're sorry, but something unexpected happened. Please try again.",
  showDetails = false
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && error && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Technical details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="flex-1"
            >
              Refresh page
            </Button>
            {resetError && (
              <Button 
                variant="outline" 
                onClick={resetError}
                className="flex-1"
              >
                Try again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific error fallbacks for different scenarios
export function NetworkErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <ErrorFallback
      title="Connection problem"
      description="Please check your internet connection and try again."
      resetError={resetError}
    />
  )
}

export function NotFoundErrorFallback() {
  return (
    <ErrorFallback
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    />
  )
}

export function FormErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <ErrorFallback
      title="Form submission failed"
      description="There was a problem submitting your form. Please try again."
      resetError={resetError}
    />
  )
}

// Inline error component for smaller errors
export function InlineError({ 
  message, 
  retry, 
  className 
}: { 
  message: string
  retry?: () => void
  className?: string 
}) {
  return (
    <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message}</span>
      {retry && (
        <Button variant="ghost" size="sm" onClick={retry} className="h-auto p-1">
          Retry
        </Button>
      )}
    </div>
  )
}