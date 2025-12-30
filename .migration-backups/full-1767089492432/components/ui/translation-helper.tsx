"use client"

import { useTranslations } from 'next-intl'
import React from 'react'

interface TranslationHelperProps {
  children: (t: (key: string, options?: any) => string) => React.ReactNode
  namespace?: string
  fallback?: (key: string) => string
  debug?: boolean
}

export function TranslationHelper({ 
  children, 
  namespace = 'common',
  fallback,
  debug = process.env.NODE_ENV === 'development'
}: TranslationHelperProps) {
  const t = useTranslations(namespace)

  const enhancedT = (key: string, options?: any): string => {
    try {
      const translation = t(key, options)
      return translation
    } catch (error) {
      // En mode debug, afficher les clés manquantes
      if (debug) {
        console.warn(`Missing translation key: ${namespace}.${key}`)
      }
      return fallback ? fallback(key) : key
    }
  }

  return <>{children(enhancedT)}</>
}

// Hook personnalisé pour les traductions avec fallback
export function useEnhancedTranslation(namespace: string = 'common') {
  const t = useTranslations(namespace)

  const enhancedT = React.useCallback((key: string, options?: any): string => {
    try {
      const translation = t(key, options)
      return translation
    } catch (error) {
      // Fallback pour les clés manquantes
      const fallbacks: Record<string, string> = {
        'title': 'Dashboard',
        'subtitle': 'Overview of your loft management system',
        'welcomeBack': 'Welcome back',
        'loading': 'Loading...',
        'error': 'Error',
        'success': 'Success',
        'cancel': 'Cancel',
        'save': 'Save',
        'edit': 'Edit',
        'delete': 'Delete',
        'view': 'View',
        'add': 'Add',
        'back': 'Back',
        'next': 'Next',
        'previous': 'Previous',
        'yes': 'Yes',
        'no': 'No',
        'name': 'Name',
        'description': 'Description',
        'date': 'Date',
        'time': 'Time',
        'status': 'Status',
        'type': 'Type',
        'amount': 'Amount',
        'currency': 'Currency',
        'category': 'Category',
        'paymentMethod': 'Payment Method',
        'loft': 'Loft',
        'owner': 'Owner',
        'guest': 'Guest',
        'task': 'Task',
        'team': 'Team',
        'conversation': 'Conversation',
        'message': 'Message',
        'notification': 'Notification',
        'report': 'Report',
        'setting': 'Setting',
        'analytics': 'Analytics',
        'reservation': 'Reservation',
        'transaction': 'Transaction',
        'bill': 'Bill',
        'utility': 'Utility',
        'zoneArea': 'Zone Area',
        'internetConnection': 'Internet Connection'
      }
      
      return fallbacks[key] || key
    }
  }, [t])

  return {
    t: enhancedT
  }
}

// Composant pour afficher les traductions avec fallback visuel
export function TranslatedText({ 
  translationKey, 
  namespace = 'common',
  fallback, 
  className = "",
  ...props 
}: { 
  translationKey: string
  namespace?: string
  fallback?: string
  className?: string
} & React.HTMLAttributes<HTMLSpanElement>) {
  const t = useTranslations(namespace)
  
  let text: string
  let isFallback = false
  
  try {
    text = t(translationKey)
  } catch (error) {
    text = fallback || translationKey
    isFallback = true
  }
  
  return (
    <span 
      className={`${className} ${isFallback ? 'text-orange-500' : ''}`}
      title={isFallback ? `Missing translation: ${namespace}.${translationKey}` : undefined}
      {...props}
    >
      {text}
    </span>
  )
}

// Hook pour détecter les clés de traduction manquantes
export function useTranslationDebug(namespace: string = 'common') {
  const t = useTranslations(namespace)
  const [missingKeys, setMissingKeys] = React.useState<string[]>([])

  const debugT = React.useCallback((key: string, options?: any): string => {
    try {
      const translation = t(key, options)
      return translation
    } catch (error) {
      setMissingKeys(prev => {
        const fullKey = `${namespace}.${key}`
        if (!prev.includes(fullKey)) {
          return [...prev, fullKey]
        }
        return prev
      })
      return key
    }
  }, [t, namespace])

  return {
    t: debugT,
    missingKeys,
    clearMissingKeys: () => setMissingKeys([])
  }
}