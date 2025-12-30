"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveWrapperProps {
  children: ReactNode
  className?: string
}

/**
 * Wrapper component to ensure consistent responsive behavior across the app
 */
export function ResponsiveWrapper({ children, className }: ResponsiveWrapperProps) {
  return (
    <div className={cn(
      "w-full min-h-screen",
      // Responsive padding
      "px-4 sm:px-6 lg:px-8",
      // Responsive container
      "max-w-7xl mx-auto",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Responsive grid component for consistent layouts
 */
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: "sm" | "md" | "lg"
}

const gapClasses = {
  sm: "gap-2 sm:gap-3",
  md: "gap-4 sm:gap-6", 
  lg: "gap-6 sm:gap-8"
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { default: 1, md: 2, lg: 3 },
  gap = "md"
}: ResponsiveGridProps) {
  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  ].filter(Boolean).join(" ")

  return (
    <div className={cn(
      "grid",
      gridCols,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Responsive card component
 */
interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  padding?: "sm" | "md" | "lg"
}

const paddingClasses = {
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8"
}

export function ResponsiveCard({ 
  children, 
  className,
  padding = "md"
}: ResponsiveCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}