"use client"

/**
 * Temporary Sonner Mock Component
 * 
 * This is a temporary replacement for the sonner library
 * to fix the build error while npm install is having issues
 */

import * as React from "react"

// Mock toast function
export const toast = {
  success: (message: string, options?: any) => {
    console.log("✅ SUCCESS:", message)
    // You can add a simple alert or custom notification here
    if (typeof window !== 'undefined') {
      // Simple browser notification as fallback
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 9999;
        font-family: system-ui;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `
      notification.textContent = message
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
    }
  },
  
  error: (message: string, options?: any) => {
    console.log("❌ ERROR:", message)
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 9999;
        font-family: system-ui;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `
      notification.textContent = message
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
    }
  },
  
  info: (message: string, options?: any) => {
    console.log("ℹ️ INFO:", message)
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 9999;
        font-family: system-ui;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `
      notification.textContent = message
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
    }
  },
  
  warning: (message: string, options?: any) => {
    console.log("⚠️ WARNING:", message)
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f59e0b;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 9999;
        font-family: system-ui;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `
      notification.textContent = message
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
    }
  },
  
  // Default toast function
  default: (message: string, options?: any) => {
    console.log("📢 TOAST:", message)
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #374151;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 9999;
        font-family: system-ui;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `
      notification.textContent = message
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
    }
  }
}

// Mock Toaster component
export function Toaster({ ...props }) {
  return (
    <div 
      id="sonner-toaster" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        zIndex: 9999,
        pointerEvents: 'none'
      }}
      {...props}
    />
  )
}

export default { toast, Toaster }