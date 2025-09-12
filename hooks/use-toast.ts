"use client"

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (toastId: string) => void
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = (++toastCount).toString()
    const newToast: Toast = {
      id,
      duration: 5000, // 5 seconds default
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const dismiss = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
}

// Global toast function for use outside components
let globalToast: ((toast: Omit<Toast, 'id'>) => void) | null = null

export function setGlobalToast(toastFn: (toast: Omit<Toast, 'id'>) => void) {
  globalToast = toastFn
}

export function showToast(toast: Omit<Toast, 'id'>) {
  if (globalToast) {
    globalToast(toast)
  }
}