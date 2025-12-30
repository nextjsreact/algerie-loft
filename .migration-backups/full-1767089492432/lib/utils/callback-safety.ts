/**
 * Utilitaires pour sécuriser les callbacks et éviter l'erreur "callback is not a function"
 */

export function safeCallback<T extends (...args: any[]) => any>(
  callback: T | undefined | null,
  fallback?: () => void
): T {
  return ((...args: Parameters<T>) => {
    try {
      if (typeof callback === 'function') {
        return callback(...args)
      } else if (typeof fallback === 'function') {
        return fallback()
      }
    } catch (error) {
      console.warn('Callback execution failed:', error)
      if (typeof fallback === 'function') {
        return fallback()
      }
    }
  }) as T
}

export function safeAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T | undefined | null,
  fallback?: () => Promise<void>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      if (typeof callback === 'function') {
        return await callback(...args)
      } else if (typeof fallback === 'function') {
        return await fallback()
      }
    } catch (error) {
      console.warn('Async callback execution failed:', error)
      if (typeof fallback === 'function') {
        return await fallback()
      }
    }
  }) as T
}

export function withCallbackSafety<T>(
  fn: () => T,
  errorMessage: string = 'Function execution failed'
): T | null {
  try {
    return fn()
  } catch (error) {
    console.warn(errorMessage, error)
    return null
  }
}