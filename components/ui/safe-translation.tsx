"use client"

import { useTranslations } from "next-intl"
import { ReactNode } from "react"

interface SafeTranslationProps {
  /**
   * The translation key path (e.g., "calendar.month")
   */
  keyPath: string
  /**
   * The namespace to use for translations (e.g., "reservations", "common")
   */
  namespace?: string
  /**
   * Fallback text to display if translation is missing
   * If not provided, will use a formatted version of the key
   */
  fallback?: string
  /**
   * Values to interpolate into the translation
   */
  values?: Record<string, string | number>
  /**
   * Whether to show development warnings in console
   * Defaults to true in development, false in production
   */
  showWarnings?: boolean
}

/**
 * SafeTranslation component provides a robust way to handle translations
 * with automatic fallbacks for missing keys and development warnings.
 * 
 * @example
 * // Basic usage
 * <SafeTranslation keyPath="calendar.month" namespace="reservations" />
 * 
 * // With custom fallback
 * <SafeTranslation 
 *   keyPath="calendar.month" 
 *   namespace="reservations" 
 *   fallback="Month" 
 * />
 * 
 * // With interpolation values
 * <SafeTranslation 
 *   keyPath="totalItems" 
 *   namespace="common" 
 *   values={{ count: 5 }} 
 * />
 */
export function SafeTranslation({ 
  keyPath, 
  namespace = "common", 
  fallback, 
  values,
  showWarnings = process.env.NODE_ENV === "development"
}: SafeTranslationProps): ReactNode {
  const t = useTranslations(namespace)
  
  try {
    // Attempt to get the translation
    const translation = t(keyPath, values)
    
    // Check if we got back the raw key (indicates missing translation)
    const fullKey = `${namespace}.${keyPath}`
    if (translation === fullKey || translation === keyPath) {
      throw new Error(`Missing translation key: ${fullKey}`)
    }
    
    return translation
  } catch (error) {
    // Log warning in development
    if (showWarnings) {
      console.warn(`🌐 SafeTranslation: Missing key "${namespace}.${keyPath}"`, {
        namespace,
        keyPath,
        fallback,
        error: error instanceof Error ? error.message : error
      })
    }
    
    // Return fallback or formatted key
    if (fallback) {
      return fallback
    }
    
    // Generate a user-friendly fallback from the key
    return formatKeyAsFallback(keyPath)
  }
}

/**
 * Formats a translation key into a user-friendly fallback text
 * @param key - The translation key (e.g., "calendar.month")
 * @returns Formatted text (e.g., "Calendar Month")
 */
function formatKeyAsFallback(key: string): string {
  return key
    .split('.')
    .pop() // Get the last part of the key
    ?.split(/[_-]/) // Split on underscores or hyphens
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || key
}

/**
 * Hook version of SafeTranslation for use in components that need the translation value
 * 
 * @example
 * const monthText = useSafeTranslation("calendar.month", "reservations", "Month")
 */
export function useSafeTranslation(
  keyPath: string, 
  namespace: string = "common", 
  fallback?: string,
  values?: Record<string, string | number>
): string {
  const t = useTranslations(namespace)
  
  try {
    const translation = t(keyPath, values)
    const fullKey = `${namespace}.${keyPath}`
    
    if (translation === fullKey || translation === keyPath) {
      throw new Error(`Missing translation key: ${fullKey}`)
    }
    
    return translation
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`🌐 useSafeTranslation: Missing key "${namespace}.${keyPath}"`, {
        namespace,
        keyPath,
        fallback,
        error: error instanceof Error ? error.message : error
      })
    }
    
    return fallback || formatKeyAsFallback(keyPath)
  }
}