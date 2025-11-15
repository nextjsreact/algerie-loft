"use client"

import { memo } from 'react'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

/**
 * Optimized DashboardHeader component with React.memo
 * Only re-renders when props change
 */
export const DashboardHeader = memo(function DashboardHeader({ 
  title, 
  subtitle,
  actions 
}: DashboardHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8" role="banner">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 truncate"
            id="page-title"
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400"
              id="page-description"
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2 sm:flex-nowrap" role="group" aria-label="Page actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
})
